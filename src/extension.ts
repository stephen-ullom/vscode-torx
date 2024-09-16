import * as vscode from "vscode";

enum Context {
   OpenCurlyBracket = 0,
   CloseCurlyBracket = 1,
   OpenRoundBracket = 2,
   CloseRoundBracket = 3,
   OpenSquareBracket = 4,
   CloseSquareBracket = 5,
   OpenXmlAttributes = 6,
   CloseXmlAttributes = 7,
   OpenXmlTag = 8,
   CloseXmlTag = 9,
}

exports.activate = function () {
   vscode.languages.registerDocumentFormattingEditProvider("torx", {
      provideDocumentFormattingEdits(document: vscode.TextDocument) {
         const activeTextEditor = vscode.window.activeTextEditor;
         const useSpaces = Boolean(activeTextEditor.options.insertSpaces);
         const tabSize = Number(activeTextEditor.options.tabSize);

         return formatDocument(document, useSpaces, tabSize);
      },
   });
};

/**
 * Provide indentation edits
 * @param document - vscode text document
 * @param useSpaces - indent with spaces or tabs
 * @param tabSize - the number of spaces if spaces are enabled
 */
function formatDocument(document: vscode.TextDocument, useSpaces = true, tabSize = 4): vscode.TextEdit[] {
   let indent = 0;
   let commentDepth = 0;

   const edits: vscode.TextEdit[] = [];
   const indentString = useSpaces ? " ".repeat(tabSize) : "\t";

   for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
      let edit: vscode.TextEdit | undefined;
      let hasTextBefore = false;

      const line = document.lineAt(lineIndex);
      const lineContext: Context[] = [];
      const spaceIndex = line.firstNonWhitespaceCharacterIndex;
      const spaceRange = new vscode.Range(
         new vscode.Position(lineIndex, 0),
         new vscode.Position(lineIndex, spaceIndex)
      );

      if (line.text.match(/^\s*$/g)) {
         // If a line is empty, then remove all whitespace
         edit = vscode.TextEdit.replace(spaceRange, "");
      } else {
         for (let charIndex = spaceIndex; charIndex < line.text.length; charIndex++) {
            const lineTextRemaining = line.text.substring(charIndex);
            const nextChar = lineTextRemaining.charAt(0);
            if (nextChar === "@") {
               if (lineTextRemaining.charAt(1) === "*") {
                  // start multiline comment
                  charIndex++;
                  commentDepth++;
               } else if (lineTextRemaining.charAt(1) === "/") {
                  // single line comment
                  charIndex += lineTextRemaining.length;
               }
            } else if (commentDepth > 0) {
               if (nextChar === "*" && lineTextRemaining.charAt(1) === "@") {
                  // end multiline comment
                  charIndex++;
                  commentDepth--;
               }
            } else {
               switch (nextChar) {
                  case "{":
                  case "(":
                  case "[":
                     const pair = getMatchingPair(lineTextRemaining);
                     if (pair) {
                        charIndex += pair.length - 1;
                     } else {
                        switch (nextChar) {
                           case "{":
                              lineContext.push(Context.OpenCurlyBracket);
                              break;
                           case "(":
                              lineContext.push(Context.OpenRoundBracket);
                              break;
                           case "[":
                              lineContext.push(Context.OpenSquareBracket);
                              break;
                        }
                        break;
                     }
                     break;
                  case "}":
                  case ")":
                  case "]":
                     if (
                        [Context.OpenCurlyBracket, Context.OpenRoundBracket, Context.OpenSquareBracket].indexOf(
                           getLast(lineContext)
                        ) >= 0
                     ) {
                        lineContext.pop();
                     } else {
                        switch (nextChar) {
                           case "}":
                              lineContext.push(Context.CloseCurlyBracket);
                              break;
                           case ")":
                              lineContext.push(Context.CloseRoundBracket);
                              break;
                           case "]":
                              lineContext.push(Context.CloseSquareBracket);
                              break;
                        }
                     }
                     break;
                  case "<":
                     const openAttributes = lineTextRemaining.match(/^<[^\!\/\s\<\>]+/);
                     const closeTag = lineTextRemaining.match(/^<\/[^\s\<\>]+>/);
                     if (openAttributes) {
                        charIndex += openAttributes[0].length - 1;
                        lineContext.push(Context.OpenXmlAttributes);
                     } else if (closeTag) {
                        charIndex += closeTag[0].length - 1;
                        if (getLast(lineContext) === Context.OpenXmlTag) {
                           lineContext.pop();
                        } else {
                           lineContext.push(Context.CloseXmlTag);
                        }
                     }
                     break;
                  case "/":
                     if (lineTextRemaining.charAt(1) === ">") {
                        charIndex++;
                        if (getLast(lineContext) === Context.OpenXmlAttributes) {
                           lineContext.pop();
                        } else {
                           lineContext.push(Context.CloseXmlAttributes);
                        }
                     }
                     break;
                  case ">":
                     if (getLast(lineContext) === Context.OpenXmlAttributes) {
                        lineContext.pop();
                        lineContext.push(Context.OpenXmlTag);
                     }
                     break;
                  default:
                     if (!hasTextBefore && lineContext.length === 0) {
                        hasTextBefore = true;
                     }
                     break;
               }
            }
         }

         // Current line
         if (
            [Context.CloseCurlyBracket, Context.CloseRoundBracket, Context.CloseSquareBracket].filter((c) =>
               lineContext.includes(c)
            ).length > 0
         ) {
            if (indent > 0) indent--;
         } else if (getLast(lineContext) === Context.CloseXmlTag) {
            if (!hasTextBefore && indent > 0) {
               indent--;
            }
         }

         // Apply if the line has changed
         const lineText = line.text.substring(spaceIndex).trim();
         const newLine = indentString.repeat(indent) + lineText;

         if (newLine !== line.text) {
            edit = vscode.TextEdit.replace(line.range, newLine);
         }
      }

      if (edit) edits.push(edit);

      // Next line
      if (
         [
            Context.OpenCurlyBracket,
            Context.OpenRoundBracket,
            Context.OpenSquareBracket,
            Context.OpenXmlAttributes,
            Context.OpenXmlTag,
         ].indexOf(getLast(lineContext)) >= 0
      ) {
         indent++;
      } else if (getLast(lineContext) === Context.CloseXmlAttributes) {
         if (indent > 0) indent--;
      } else if (getLast(lineContext) === Context.CloseXmlTag) {
         if (hasTextBefore && indent > 0) {
            indent--;
         }
      }
   }

   return edits;
}

/**
 * Get the last element in array
 * @param array - any array
 */
function getLast(array: any[]): any {
   return array.slice(-1)[0];
}

/**
 * Get the string including the matching pair
 * @param text - a string that begins with (, { or [
 */
function getMatchingPair(text: string): string {
   const pairs = [
      {
         open: "(",
         close: ")",
      },
      {
         open: "{",
         close: "}",
      },
      {
         open: "[",
         close: "]",
      },
   ];
   if (text.length > 0) {
      const pair = pairs.find((p) => p.open === text[0]);
      if (pair) {
         let index = 1;
         let depth = 0;
         while (index < text.length) {
            const char = text.charAt(index);
            if (["'", '"', "`"].indexOf(char) >= 0) {
               const quotedString = getMatchingQuotes(text.substring(index));
               if (quotedString) {
                  index += quotedString.length - 1;
               } else {
                  return null;
               }
            } else if (char === pair.close) {
               if (depth === 0) {
                  return text.substring(0, index + 1);
               } else {
                  depth--;
               }
            } else if (char === pair.open) {
               depth++;
            }
            index++;
         }
      }
   }
   return null;
}

/**
 * Get the string including the matching quotes
 * @param text - a string that begins with ', " or `
 */
function getMatchingQuotes(text: string): string {
   const quotes = ["'", '"', "`"];
   if (text.length > 0) {
      const quote = quotes.find((q) => q === text[0]);
      if (quote) {
         let index = 1;
         while (index < text.length) {
            const char = text.charAt(index);
            if (char === "\\") {
               index++;
            } else if (char === quote) {
               return text.substring(0, index + 1);
            }
            index++;
         }
      }
   }
   return null;
}
