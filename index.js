const vscode = require('vscode')

function activate(context) {

    vscode.languages.registerDocumentFormattingEditProvider('torx', {

        provideDocumentFormattingEdits(document) {
            const configuration = vscode.workspace.getConfiguration()
            const tabSize = configuration.get('editor.tabSize');
            const output = []
            let indentCount = 0

            for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
                let line = document.lineAt(lineIndex)

                // Remove // comment from line
                let lineText = line.text.replace(/^\s*\/\/.*/, '')

                // Whitespace at the beginning of the line.
                let spaceMatch = line.text.match(/^\s*/)
                let spaceLength = spaceMatch ? spaceMatch[0].length : 0

                if (lineText.match(/^\s*\<\/\w+\>/)) {
                    // Begin in </tag>
                    indentCount--
                } else if (lineText.match(/^\s*[\}\]]/)) {
                    // Begin with } or ]
                    indentCount--
                }

                let start = new vscode.Position(lineIndex, 0)
                let end = new vscode.Position(lineIndex, spaceLength)
                let indentation = ''

                if (indentCount >= 0 && !line.text.match(/^\s*$/)) {
                    // Positive indent || not only whitespace
                    indentation = ' '.repeat(tabSize).repeat(indentCount)
                }

                let edit = vscode.TextEdit.replace(new vscode.Range(start, end), indentation)

                output.push(edit)

                if (lineText.match(/^\s*\<\w+/)) {
                    // Begin in <tag>
                    if (!lineText.match(/\<\/\w+\>$|\/\>\s*$/)) {
                        // Not end with </tag> or />
                        indentCount++
                    }
                } else if (lineText.match(/\<\/\w+\>\s*$|\/\>\s*$/)) {
                    // End with </tag> or />
                    if (!lineText.match(/^\s*\<\/\w+\>/)) {
                        // Not begin with </tag>
                        indentCount--
                    }
                } else if (lineText.match(/[\{\[]\s*$/)) {
                    // End in { or [
                    indentCount++
                }
            }

            return output
        }

    })
}

exports.activate = activate