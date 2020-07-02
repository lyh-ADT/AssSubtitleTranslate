// @ts-check


(function(){
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    
    function updateContent(/**@type {string}*/text){
        document.querySelector("h1").textContent = text;
    }

    window.addEventListener("message", event=>{
        const message = event.data;
        switch(message.type){
            case 'update':
                const text = message.text;
                updateContent(text);
                return;
        }
    });

    vscode.postMessage({
        type: "message",
        text: "hi"
    });
}());