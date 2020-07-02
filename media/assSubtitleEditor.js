// @ts-check
class SubtitleLine{
    constructor(/**@type {number}*/line_number, /**@type {string}*/info, /**@type {string}*/content){
        this.line_number = line_number;
        this.info = info;
        this.content = content;
    }

    toString(){
        return `{info:'${this.info}',content:'${this.content}'}`;
    }
}
class AssSubtitle{
    
    constructor(/**@type {string}*/text){
        this.lines = this.parse(text);
    }

    parse(/**@type {string}*/text){
        let lines = [];
        const dialogue_re = /Dialogue: \d+,\d+:\d+:\d+.\d+,\d+:\d+:\d+.\d+,\w+,,\d,\d,\d,,(.*)/g;
        for(let line of text.match(dialogue_re)){
            let match = line.match(/(Dialogue: \d+,\d+:\d+:\d+.\d+,\d+:\d+:\d+.\d+,\w+,,\d,\d,\d,,)(.*)/);
            lines.push(new SubtitleLine(0, match[1], match[2]));
        }
        document.querySelector("h1").innerHTML = lines.join("<br>");
        return lines;
    }
}

(function(){
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    
    function updateContent(/**@type {string}*/text){
        // document.querySelector("h1").textContent = text;
        new AssSubtitle(text);
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