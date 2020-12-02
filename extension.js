const vscode = require('vscode')

function activate(context) {

    vscode.languages.registerDocumentFormattingEditProvider('torx', {

        provideDocumentFormattingEdits(document) {

            let output = []
            let indentCount = 0

            for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {
                let line = document.lineAt(lineIndex)

                // Whitespace at the beginning of the line.
                let spaceMatch = line.text.match(/^\s*/)
                let spaceLength = spaceMatch ? spaceMatch[0].length : 0

                if (line.text.match(/^\s*\<\/\w+\>/g)) {
                    // Begin in </tag>
                    indentCount--
                } else if (line.text.match(/^\s*\}/g)) {
                    // Begin in }
                    indentCount--
                }

                let start = new vscode.Position(lineIndex, 0)
                let end = new vscode.Position(lineIndex, spaceLength)
                let indentation = indentCount >= 0 ? '    '.repeat(indentCount) : ''
                let edit = vscode.TextEdit.replace(new vscode.Range(start, end), indentation)

                output.push(edit)

                if (line.text.match(/^\s*\<\w+/g)) {
                    // Begin in <tag>
                    if (!line.text.match(/\<\/\w+\>$/g)) {
                        // Not end with </tag>
                        indentCount++
                    }
                } else if (line.text.match(/\<\/\w+\>$/g)) {
                    // End with </tag>
                    if (!line.text.match(/^\s*\<\/\w+\>/g)) {
                        // Not begin with </tag>
                        indentCount--
                    }
                } else if (line.text.match(/\{$/g)) {
                    // End in {
                    indentCount++
                }
            }

            return output
        }

    })
}

exports.activate = activate


// provideDocumentFormattingEdits(document) {
//     let output = []
//     let indentCount = 0

//     for (let lineIndex = 0; lineIndex < document.lineCount; lineIndex++) {

//         let line = document.lineAt(lineIndex)

//         let whitespaceLength = 0
//         let whitespaceMatch = line.text.match(/^\s*/)

//         let openBrackets = line.text.match(/<[^\/|!][^>]*[^\/]>|<(?!.*\/?>)|{/g)
//         let closeBrackets = line.text.match(/<\/\w+>|}/g)

//         if (whitespaceMatch) {
//             whitespaceLength = whitespaceMatch[0].length
//         }

//         let open = openBrackets ? openBrackets.length : 0
//         let close = closeBrackets ? closeBrackets.length : 0

//         if (open - close < 0)
//             indentCount += open - close

//         if (indentCount < 0) indentCount = 0
//         let start = new vscode.Position(lineIndex, 0)
//         let end = new vscode.Position(lineIndex, whitespaceLength)
//         let indentation = '    '.repeat(indentCount)
//         let edit = vscode.TextEdit.replace(new vscode.Range(start, end), indentation)

//         if (open - close > 0)
//             indentCount += open - close

//         output.push(edit)
//     }

//     return output
// }



/// TRY 2

   // const context = {
            //     ROOT: 0,
            //     ATTRIBUTES: 1,
            //     TAG: 2,
            //     PARENTHESIS: 3,
            //     BRACKETS: 4,
            //     COMMENT: 5
            // }

            // let contextList = [context.ROOT]


//// Look for </, >, ), }, *@
                // const unindentRegex = /\<\/|\>|\)|\}|\*\@/g
                // let unindentMatch

                // while (unindentMatch = unindentRegex.exec(line.text)) {

                //     let firstChar = unindentMatch[0][0]
                //     let currentContext = contextList[contextList.length - 1]

                //     switch (currentContext) {
                //         case context.BRACKETS:
                //             switch (unindentMatch[0]) {
                //                 case '}':
                //                     contextList.pop()
                //                     indentCount--
                //                     break;
                //             }
                //             break;
                //         case context.TAG:
                //             if(unindentMatch[0] == '</') {
                //                 contextList.pop()
                //                 indentCount--
                //             }
                //             break;
                //     }
                // }

                // let start = new vscode.Position(lineIndex, 0)
                // let end = new vscode.Position(lineIndex, spaceLength)
                // let indentation = '    '.repeat(indentCount)
                // let edit = vscode.TextEdit.replace(new vscode.Range(start, end), indentation)

                // output.push(edit)
                // console.log(contextList.toString(), 'at line', lineIndex);

                // Look for <tag, >, (, {, @//, @*
                // const indentRegex = /<\w+|\>|\(|\{|\@\/\/|\@\*/g
                // let indentMatch

                // while (indentMatch = indentRegex.exec(line.text)) {

                //     let firstChar = indentMatch[0][0]

                //     switch (contextList[contextList.length - 1]) {
                //         case context.ROOT:
                //         case context.BRACKETS:
                //             switch (firstChar) {
                //                 case '<':
                //                     contextList.push(context.ATTRIBUTES)
                //                     indentCount++
                //                     break;
                //                 case '{':
                //                     contextList.push(context.BRACKETS)
                //                     indentCount++
                //                     break;
                //             }
                //             break;

                //         case context.ATTRIBUTES:
                //             switch (firstChar) {
                //                 case '>':
                //                     contextList.pop()
                //                     contextList.push(context.TAG)
                //                     break;
                //             }
                //             break;

                //         case context.TAG:
                //             switch (firstChar) {
                //                 case '<':
                //                     contextList.push(context.ATTRIBUTES)
                //                     indentCount++
                //                     break;
                //                 case '{':
                //                     contextList.push(context.BRACKETS)
                //                     indentCount++
                //                     break;

                //             }
                //             break;
                //     }

                // }
