import * as vscode from 'vscode';

let console = vscode.window.createOutputChannel("Torx"); // DEV

exports.activate = function (context: vscode.ExtensionContext) {
    vscode.languages.registerDocumentFormattingEditProvider('torx', {
        provideDocumentFormattingEdits(document: vscode.TextDocument) {
            const editorConfig = vscode.workspace.getConfiguration('editor');
            const useSpaces: boolean = editorConfig.insertSpaces === undefined ? false : editorConfig.insertSpaces;
            const tabSize: number = Number(editorConfig.tabSize);

            console.appendLine('spaces ' + useSpaces);
            console.appendLine('tab ' + tabSize);
            const edits: vscode.TextEdit[] = [];
            let depth: number = 0;

            // TODO: simplify
            for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
                const line = document.lineAt(lineIndex);
                const space = line.text.match(/^\s*/);
                const spaceLength = space ? space[0].length : 0;
                const rangeStart = new vscode.Position(lineIndex, 0);
                const rangeEnd = new vscode.Position(lineIndex, spaceLength);
                let indentation = '';
                if (line.text.match(/^\s*(<\/[-_\.A-Za-z0-9]+\b[^>]*>|\}|\)|\])/)) {
                    depth--;
                }
                if (useSpaces) {
                    indentation = ' '.repeat(tabSize).repeat(depth >= 0 ? depth : 0);
                } else {
                    indentation = '\t'.repeat(depth >= 0 ? depth : 0);
                }
                if (line.text.match(/<(?!\?|[^>]*\/>)([-_\.A-Za-z0-9]+)(?=\s|>)\b[^>]*>(?!.*<\/\1>)|\{[^\}\"']*|\([^\)\"']*|\[[^\]"']*$/)) {
                    depth++;
                }
                const edit = vscode.TextEdit.replace(new vscode.Range(rangeStart, rangeEnd), indentation);
                edits.push(edit);
            }
            return edits;
        }
    });
}
