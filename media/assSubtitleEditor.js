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

    render(/**@type {Element}*/parent){
        const div = document.createElement("div");
        div.className = "line";
        div.innerHTML = /*html*/`
            <p>${this.info}</p>
            <h4>${this.content}</h4>
            <textarea class="editarea">${this.content}</textarea>
        `;
        parent.appendChild(div);
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
        return lines;
    }

    render(/**@type {Element}*/parent){
        const div = document.createElement("div");
        for(let line of this.lines){
            line.render(div);
        }
        parent.appendChild(div);
    }
}

(function(){
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    
    function updateContent(/**@type {string}*/text){
        // document.querySelector("h1").textContent = text;
        new AssSubtitle(text).render(document.body);
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