import * as vscode from  'vscode';

import * as path from 'path';

export class AssSubtitleTranslateEditorProvider implements vscode.CustomTextEditorProvider {
    public static register(context: vscode.ExtensionContext): vscode.Disposable{
        const provider = new AssSubtitleTranslateEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(AssSubtitleTranslateEditorProvider.viewType, provider);
        return providerRegistration;
    }

    private static readonly viewType = "AssSubtitleTranslate.view";
    private document:vscode.TextDocument|null = null;
    private webview:vscode.Webview|null = null;
    private lastChange : {range: vscode.Range,text:""} | null = {range:new vscode.Range(0,0,0,0),text:""};

    constructor(private readonly context: vscode.ExtensionContext){}
    
    resolveCustomTextEditor(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel, token: vscode.CancellationToken): void | Thenable<void> {
        webviewPanel.webview.options = {
            enableScripts: true
        };
        webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);
        this.document = document;
        this.webview = webviewPanel.webview;
        
        let lastChange = null;

        const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(this.onDidChangeTextDocument);

        webviewPanel.onDidDispose(()=>{
            changeDocumentSubscription.dispose();
        });

        webviewPanel.webview.onDidReceiveMessage(e=>{
            switch(e.type){
                case "update":
                    this.updateDocumentWithLine(document, e.line);
                    return;
            }
        })

        webviewPanel.webview.postMessage({
            type: "update",
            text: document.getText()
        });
    }

    private getHtmlForWebview(webview: vscode.Webview): string {

        const scriptUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'assSubtitleEditor.js')
        ));
        const styleUri = webview.asWebviewUri(vscode.Uri.file(
            path.join(this.context.extensionPath, 'media', 'assSubtitleEditor.css')
        ));


        return /*html*/`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta chartset="utf-8">
                <meta name="viewport" content="width-device, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet" />
                <title>My SubTitle Webview HTML</title>
            </head>
            <body>
                <script src="${scriptUri}"></script>
            </body>
            </html>
        `;
    }

    private onDidChangeTextDocument = (e: vscode.TextDocumentChangeEvent)=>{
        if(this.document == null || this.webview == null || e.contentChanges.length == 0){
            return;
        }
        if(e.contentChanges.length == 1 && this.lastChange != null){
            const cuurentChange = e.contentChanges[0];
            if(this.lastChange.range.isEqual(cuurentChange.range)
                && this.lastChange.text == cuurentChange.text){
                this.lastChange = null;
                return;
            }
        }
        if(e.document.uri.toString() === this.document.uri.toString()){
            this.webview.postMessage({
                type: "update",
                text: this.document.getText()
            });
        }
    }
    
    private updateDocumentWithLine(document:vscode.TextDocument, line:any){
        const offset = document.getText().search(line.info);
        const start = document.positionAt(offset);
        const textLine = document.lineAt(start.line);

        this.lastChange = {
            range: textLine.range,
            text: line.info+line.content
        };

        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, textLine.range, line.info+line.content);
        vscode.workspace.applyEdit(edit);
    }
}