// @ts-check
class SubtitleLine{
    constructor(/**@type {AssSubtitle}*/assSubtitle, /**@type {number}*/line_number, /**@type {string}*/info, /**@type {string}*/content){
        this.assSubtitle = assSubtitle;
        this.line_number = line_number;
        this.info = info;
        this.content = content;
        this.editArea = null;
        this.containor = null;
    }

    toString(){
        return `{info:'${this.info}',content:'${this.content}'}`;
    }

    render(/**@type {Element}*/parent){
        const div = this.containor = document.createElement("div");
        div.className = "line";
        div.innerHTML = /*html*/`
            <p>${this.info}</p>
            <h4>${this.content}</h4>
        `;
        div.appendChild(this.getEditArea(this.content));
        parent.appendChild(div);
    }

    getEditArea(/**@type {string}*/content){
        this.editArea = document.createElement("textarea");
        this.editArea.className = "editarea";
        this.editArea.textContent = content;
        this.editArea.oninput=this.onEditAreaInput;
        return this.editArea;
    }

    focus(){
        console.assert(this.containor != null && this.editArea != null, "haven't render this");
        window.scroll(0, this.containor.offsetTop-this.containor.offsetHeight);
        this.editArea.select();
    }

    onEditAreaInput = ()=>{
        const content_length = this.editArea.value.length;
        const inputChar = this.editArea.value[content_length-1];
        if(inputChar == "\n"){
            this.editArea.value = this.editArea.value.slice(0, content_length-1);
            this.assSubtitle.goToEditArea(this.line_number+1);
        }
    }
}
class AssSubtitle{
    
    constructor(vscode, /**@type {string}*/text){
        this.vscode = vscode;
        this.lines = this.parse(text);
        this.editting_index = 0;
    }

    parse(/**@type {string}*/text){
        let lines = [];
        const dialogue_re = /Dialogue: \d+,\d+:\d+:\d+.\d+,\d+:\d+:\d+.\d+,\w+,,\d,\d,\d,,(.*)/g;
        for(let line of text.match(dialogue_re)){
            let match = line.match(/(Dialogue: \d+,\d+:\d+:\d+.\d+,\d+:\d+:\d+.\d+,\w+,,\d,\d,\d,,)(.*)/);
            lines.push(new SubtitleLine(this, lines.length, match[1], match[2]));
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

    goToEditArea(/**@type {number}*/index){
        this.lines[index].focus();
    }

    consoleLog(...param){
        this.vscode.postMessage(param);
    }
}

(function(){
    // @ts-ignore
    const vscode = acquireVsCodeApi();
    
    function updateContent(/**@type {string}*/text){
        // document.querySelector("h1").textContent = text;
        new AssSubtitle(vscode, text).render(document.body);
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