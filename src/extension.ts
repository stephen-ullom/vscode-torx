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

exports.activate = function (context: vscode.ExtensionContext) {
   vscode.languages.registerDocumentFormattingEditProvider("torx", {
      provideDocumentFormattingEdits(document: vscode.TextDocument) {
         const editorConfig = vscode.workspace.getConfiguration("editor");
         const useSpaces = editorConfig.insertSpaces === undefined ? false : Boolean(editorConfig.insertSpaces);
         const tabSize = Number(editorConfig.tabSize);
         const edits: vscode.TextEdit[] = [];
         const indentString = useSpaces ? " ".repeat(tabSize) : "\t";
         let indent = 0;
         let commentDepth = 0;
         for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
            const line = document.lineAt(lineIndex);
            const lineContext: Context[] = [];
            const space = line.text.match(/^\s*/);
            const spaceIndex = space ? space[0].length : 0;
            const spaceRange = new vscode.Range(
               new vscode.Position(lineIndex, 0),
               new vscode.Position(lineIndex, spaceIndex)
            );
            let hasTextBefore = false;
            for (let charIndex = spaceIndex; charIndex < line.text.length; charIndex++) {
               const lineTextRemaining = line.text.substring(charIndex);
               const nextChar = lineTextRemaining.charAt(0);
               if (nextChar === "@") {
                  if (lineTextRemaining.charAt(1) === "*") {
                     charIndex++;
                     commentDepth++;
                  } else if (lineTextRemaining.charAt(1) === "/" && lineTextRemaining.charAt(2) === "/") {
                     charIndex += lineTextRemaining.length;
                  }
               } else if (commentDepth > 0) {
                  if (nextChar === "*" && lineTextRemaining.charAt(1) === "@") {
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
               [Context.CloseCurlyBracket, Context.CloseRoundBracket, Context.CloseSquareBracket].indexOf(
                  getLast(lineContext)
               ) >= 0
            ) {
               indent === 0 ? 0 : indent--;
            } else if (getLast(lineContext) === Context.CloseXmlTag) {
               if (!hasTextBefore) {
                  indent === 0 ? 0 : indent--;
               }
            }

            // Apply
            const edit = vscode.TextEdit.replace(spaceRange, indentString.repeat(indent));
            edits.push(edit);

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
               indent === 0 ? 0 : indent--;
            } else if (getLast(lineContext) === Context.CloseXmlTag) {
               if (hasTextBefore) {
                  indent === 0 ? 0 : indent--;
               }
            }
         }
         return edits;
      },
   });
};

/**
 * Get the last element in array
 */
function getLast(array: any[]): any {
   return array.slice(-1)[0];
}

/**
 * Get the string including the matching pair
 * @param text - should begin with (, { or [
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
 * @param text - should begin with ', " or `
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
