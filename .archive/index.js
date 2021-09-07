const vscode = require('vscode');

exports.activate = function(context) {

    vscode.languages.registerDocumentFormattingEditProvider('torx', {

        provideDocumentFormattingEdits(document) {
            const tabSize = vscode.workspace.getConfiguration().get('editor.tabSize');
            const edits = [];
            let depth = 0;

            for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
                let line = document.lineAt(lineIndex);

                // Remove // comment from line
                let lineText = line.text.replace(/^\s*\/\/.*/, '');

                // Whitespace at the beginning of the line.
                let spaceMatch = line.text.match(/^\s*/);
                let spaceLength = spaceMatch ? spaceMatch[0].length : 0;

                if (lineText.match(/^\s*\<\/[^\s\<\>\/]+\>/)) {
                    // Begin in </tag>
                    depth--;
                } else if (lineText.match(/^\s*[\}\]\)]/)) {
                    // Begin with }, ] or )
                    depth--;
                }

                let start = new vscode.Position(lineIndex, 0);
                let end = new vscode.Position(lineIndex, spaceLength);
                let indentation = '';

                if (depth >= 0 && !line.text.match(/^\s*$/)) {
                    // Positive indent || not only whitespace
                    indentation = ' '.repeat(tabSize).repeat(depth);
                }

                let edit = vscode.TextEdit.replace(new vscode.Range(start, end), indentation);

                edits.push(edit)

                if (lineText.match(/^\s*\<[^\s\<\>\/]+/)) {
                    // Begin in <tag>
                    if (!lineText.match(/\<\/[^\s\<\>\/]+\>\s*$|\/\>\s*$/)) {
                        // Not end with </tag> or />
                        depth++;
                    }
                } else if (lineText.match(/\<\/[^\s\<\>\/]+\>\s*$|\/\>\s*$/)) {
                    // End with </tag> or />
                    if (!lineText.match(/^\s*\<\/[^\s\<\>\/]+\>/)) {
                        // Not begin with </tag>
                        depth--;
                    }
                } else if (lineText.match(/[\{\[\(]\s*$/)) {
                    // End in {, [ or (
                    depth++;
                }
            }

            return edits;
        }

    })
}
