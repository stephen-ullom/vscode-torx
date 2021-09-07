import * as vscode from 'vscode';

enum Context {
    CurlyBracket = 0,
    RoundBracket = 1,
    SquareBracket = 2,
    XmlElement = 3,
    XmlContent = 4
}

let console = vscode.window.createOutputChannel("Torx"); // DEV

exports.activate = function (context: vscode.ExtensionContext) {
    vscode.languages.registerDocumentFormattingEditProvider('torx', {
        provideDocumentFormattingEdits(document: vscode.TextDocument) {
            const editorConfig = vscode.workspace.getConfiguration('editor');
            const useSpaces: boolean = editorConfig.insertSpaces === undefined ? false : editorConfig.insertSpaces;
            const tabSize: number = Number(editorConfig.tabSize);
            const edits: vscode.TextEdit[] = [];
            let context: Context[] = [];
            let unindent = 0;
            for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
                const line = document.lineAt(lineIndex);
                const space = line.text.match(/^\s*/);
                const spaceIndex = space ? space[0].length : 0;
                const spaceRange = new vscode.Range(
                    new vscode.Position(lineIndex, 0),
                    new vscode.Position(lineIndex, spaceIndex)
                );
                let indentation = '';
                const indent = (context.length - unindent) >= 0 ? context.length - unindent : 0;
                console.appendLine('Line ' + (lineIndex + 1) + ':' + indent)
                if (useSpaces) {
                    indentation = ' '.repeat(tabSize).repeat(indent);
                } else {
                    indentation = '\t'.repeat(indent);
                }
                unindent = 0;
                let charIndex = spaceIndex;
                while (charIndex <= line.text.length) {
                    const lineInput = line.text.substring(charIndex);
                    const nextChar = lineInput.charAt(0);
                    switch (nextChar) {
                        case '{':
                        case '(':
                        case '[':
                            const pair = getMatchingPair(lineInput);
                            if (pair) {
                                charIndex += pair.length;
                            } else {
                                switch (nextChar) {
                                    case '{':
                                        context.push(Context.CurlyBracket);
                                        break;
                                    case '(':
                                        context.push(Context.RoundBracket);
                                        break;
                                    case '[':
                                        context.push(Context.SquareBracket);
                                        break;
                                }
                                break;
                            }
                            break;
                        case '}':
                        case ')':
                        case ']':
                            if ([
                                Context.CurlyBracket,
                                Context.RoundBracket,
                                Context.SquareBracket
                            ].indexOf(context.slice(-1)[0]) >= 0) {
                                context.pop();
                                unindent = 2;
                            }
                            break;
                        case '<':
                            const xmlOpen = lineInput.match(/<[^\s\<\>]+/);
                            const xmlClose = lineInput.match(/<\/[^\s\<\>]+>/);
                            if (xmlOpen) {
                                context.push(Context.XmlElement);
                            } else if (xmlClose && context.slice(-1)[0] === Context.XmlContent) {
                                context.pop();
                            }
                            break;
                        case '>':
                            if (context.slice(-1)[0] === Context.XmlElement) {
                                context.pop();
                                context.push(Context.XmlContent);
                                unindent = 2;
                            }
                            break;
                        default:
                            break;
                    }
                    charIndex++;
                }
                // if (line.text.match(/^\s*(<\/[-_\.A-Za-z0-9]+\b[^>]*>|\}|\)|\])/)) {
                //     depth--;
                // }

                // if (line.text.match(/<(?!\?|[^>]*\/>)([-_\.A-Za-z0-9]+)(?=\s|>)\b[^>]*>(?!.*<\/\1>)|\{[^\}\"']*|\([^\)\"']*|\[[^\]"']*$/)) {
                //     depth++;
                // }
                const edit = vscode.TextEdit.replace(spaceRange, indentation);
                edits.push(edit);
            }
            return edits;
        }
    });
}

/**
 * @param {string} text - should begin with (, { or [
 */
function getMatchingPair(text: string): string {
    const pairs = [
        {
            open: '(',
            close: ')'
        },
        {
            open: '{',
            close: '}'
        },
        {
            open: '[',
            close: ']'
        }
    ];
    if (text.length > 0) {
        const pair = pairs.find(p => p.open === text[0]);
        if (pair) {
            let index = 1;
            let depth = 0;
            while (index < text.length) {
                const char = text.charAt(index);
                if (['\'', '"', '`'].indexOf(char) >= 0) {
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
 * @param {string} text - should begin with ', " or `
 */
function getMatchingQuotes(text: string): string {
    const quotes = ['\'', '"', '`'];
    if (text.length > 0) {
        const quote = quotes.find(q => q === text[0]);
        if (quote) {
            let index = 1;
            while (index < text.length) {
                const char = text.charAt(index);
                if (char === '\\') {
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