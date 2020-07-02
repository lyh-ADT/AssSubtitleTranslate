import * as vscode from  'vscode';

export class AssSubtitleTranslateEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable{
        const provider = new AssSubtitleTranslateEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(AssSubtitleTranslateEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private static readonly viewType = "AssSubtitleTranslate.view";

    constructor(private readonly context: vscode.ExtensionContext){}
    
    resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e=>{
            if(e.document.uri.toString() === document.uri.toString()){
                webviewPanel.webview.postMessage({
                    type: "update",
                    text: document.getText()
                });
            }
        });

        webviewPanel.webview.postMessage({
            type: "update",
            text: document.getText()
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {
        return /*html*/`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta chartset="utf-8">
                <meta name="viewport" content="width-device, initial-scale=1.0">
                <title>My SubTitle Webview HTML</title>
            </head>
            <body>
                <h1>My SubTitle Webview HTML</h1>
            </body>
            </html>
        `;
    }
    
}