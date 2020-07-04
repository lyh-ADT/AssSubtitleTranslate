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
        parent.appendChild(div);
        div.className = "line";
        div.innerHTML = /*html*/`
            <p>${this.info}</p>
            <h4>${this.content}</h4>
        `;
        div.appendChild(this.getEditArea(this.content));
    }

    getEditArea(/**@type {string}*/content){
        this.editArea = document.createElement("textarea");
        this.editArea.className = "editarea";
        this.editArea.textContent = content;
        this.editArea.oninput=this.onEditAreaInput;
        return this.editArea;
    }

    focus(offset){
        console.assert(this.containor != null && this.editArea != null, "haven't render this");
        window.scroll(0, this.containor.offsetTop-this.containor.offsetHeight);
        this.editArea.select();
        if(offset > 0){
            this.editArea.setSelectionRange(offset, offset);
        }
    }

    onEditAreaInput = ()=>{
        const content_length = this.editArea.value.length;
        const inputChar = this.editArea.value[content_length-1];
        if(inputChar == "\n"){
            this.editArea.value = this.editArea.value.slice(0, content_length-1);
            this.assSubtitle.goToEditArea(this.line_number+1, 0);
            return;
        }
        this.assSubtitle.setEditAreaOffset(this.editArea.selectionStart);
        this.assSubtitle.postMessage({
            type: "update",
            line:{
                info: this.info,
                content: this.editArea.value
            }
        });
    }
}
class AssSubtitle{

    static EventFormat={
        "Marked": "\\d",
        "Layer": "\\d+",
        "Start": "\\d+:\\d\\d:\\d\\d[\\.:]\\d\\d",
        "End": "\\d+:\\d\\d:\\d\\d[\\.:]\\d\\d",
        "Style": "\\w+",
        "Name": "\\w*",
        "MarginL": "\\d+",
        "MarginR": "\\d+",
        "MarginV": "\\d+",
        "Effect": ".*?",
        "Text": ".*"
    };

    getDialogueRegExpFromFormat(/**@type {string}*/format_str){
        let format_regexp = [];
        for(const format of format_str.split(",")){
            const reg = AssSubtitle.EventFormat[format.trim()];
            if(reg == null){
                this.showError("Unknown Info: "+format.trim());
                let supported_infos = [];
                for(let i in AssSubtitle.EventFormat){
                    supported_infos.push(i);
                }
                this.log("Only support info:", supported_infos);
                return;
            }
            if(format.trim() == "Text"){
                format_regexp.push("("+reg+")");
            }else{
                format_regexp.push(reg);
            }
        }
        return new RegExp("Dialogue: "+format_regexp.join(","), "g");
    }
    
    constructor(vscode){
        this.vscode = vscode;
        this.lines = [];
        this.editting_index = 0;
        this.editting_offset = 0;
    }

    parse(/**@type {string}*/text){
        const events_section_index = text.search("[Events]");
        if(events_section_index == -1){
            this.showError("Not found [Events] Section, Please Check the File Format");
            return;
        }
        const events_setion = text.substring(events_section_index);
        const events_format_match = events_setion.match(/Format:(.+)/);
        if(events_format_match == null){
            this.showError("Not found Format Line, Please Check the File Format");
            this.log(`[Events] Section should contain one line like: "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text" to specify the format of dialogue.`)
            return;
        }
        const events_format = events_format_match[1];

        this.log("found format", events_format);

        const dialogue_re = this.getDialogueRegExpFromFormat(events_format);

        console.log("format matcher", dialogue_re);

        let lines = [];

        // @ts-ignore
        for(let line of events_setion.matchAll(dialogue_re)){
            const content = line[1];
            if(content == undefined){
                this.showError("Found empty line");
                this.log("Found empty line", line);
                return;
            }
            const info = line[0].substring(0, line[0].indexOf(content));
            lines.push(new SubtitleLine(this, lines.length, info, content));
        }
        this.lines = lines;
        if(lines.length == 0){
            this.log("Not found any lines, you should use AssSubtitleTranslateEditor with a pre make .ass file");
        }
    }

    render(/**@type {Element}*/parent){
        document.body.innerHTML = "";
        const div = document.createElement("div");
        parent.appendChild(div);
        for(let line of this.lines){
            line.render(div);
        }
        this.goToEditArea(this.editting_index, this.editting_offset);
    }

    setEditAreaOffset(/**@type {number}*/offset){
        this.editting_offset = offset;
    }

    goToEditArea(/**@type {number}*/index, /**@type {number}*/offset){
        this.editting_index = index;
        this.lines[index].focus(offset);
        console.log(index, offset);
    }

    log(...param){
        this.postMessage({
            type: "log",
            message: param.join(" ")
        });
    }

    showError(message){
        this.postMessage({
            type: "error",
            message: message
        });
    }

    postMessage(param){
        this.vscode.postMessage(param);
    }
}

(function(){
    // @ts-ignore
    const vscode = acquireVsCodeApi();

    const assSubtitle = new AssSubtitle(vscode);
    
    function updateContent(/**@type {string}*/text){
        assSubtitle.log("Update from text document change");
        assSubtitle.parse(text);
        assSubtitle.render(document.body);
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