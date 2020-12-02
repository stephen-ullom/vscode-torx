const vscode = require('vscode')

function activate(context) {

    vscode.languages.registerDocumentFormattingEditProvider('torx', {

        provideDocumentFormattingEdits(document) {

            let output = []
            let indentCount = 0

            for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
                let line = document.lineAt(lineIndex)
                // Remove @// or // comments from line
                let lineText = line.text.replace(/\@?\/\/.*$/, '')

                // Whitespace at the beginning of the line.
                let spaceMatch = line.text.match(/^\s*/)
                let spaceLength = spaceMatch ? spaceMatch[0].length : 0

                if (lineText.match(/^\s*\<\/\w+\>/g)) {
                    // Begin in </tag>
                    indentCount--
                } else if (lineText.match(/^\s*\}/g)) {
                    // Begin in }
                    indentCount--
                }

                let start = new vscode.Position(lineIndex, 0)
                let end = new vscode.Position(lineIndex, spaceLength)
                let indentation = indentCount >= 0 ? '    '.repeat(indentCount) : ''
                let edit = vscode.TextEdit.replace(new vscode.Range(start, end), indentation)

                output.push(edit)

                if (lineText.match(/^\s*\<\w+/g)) {
                    // Begin in <tag>
                    if (!lineText.match(/\<\/\w+\>$|\/\>/g)) {
                        // Not end with </tag> or />
                        indentCount++
                    }
                } else if (lineText.match(/\<\/\w+\>$|\/\>/g)) {
                    // End with </tag> or />
                    if (!lineText.match(/^\s*\<\/\w+\>/g)) {
                        // Not begin with </tag>
                        indentCount--
                    }
                } else if (lineText.match(/\{$/g)) {
                    // End in {
                    indentCount++
                }
            }

            return output
        }

    })
}

exports.activate = activate