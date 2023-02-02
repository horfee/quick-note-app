import { LitElement, html, css } from 'lit';
import { property, query, queryAll, queryAssignedElements, state } from 'lit/decorators.js';
import { Note, Attachment, Label} from './NoteDefinition';
import { QuickNoteItem } from './QuickNoteItem';
import './QuickNotetag';
import './QuickNoteAttachment';
import { dateRenderingOptions } from './utils';
import { BackList, RefreshIcon, SaveIcon } from '../assets/icons';
//import "trix/dist/trix.css";
//import sheet from "./assets/tri.css";
//import "trix";
//import '@tinymce/tinymce-webcomponent';
import './TinyMCEEditor';
import 'tinymce';
import { TinyMce } from './TinyMCEEditor';

const saveImage = new URL('../../assets/save.svg', import.meta.url).href;
const refreshImage = new URL('../../assets/refresh.svg', import.meta.url).href;

export class QuickNoteDetailPanel extends LitElement {


  @property({reflect: true, attribute: "editable"})
  editable: Boolean = false;

  @property({reflect: true, attribute: "hidden"})
  hidden: boolean = false;

  static styles = [ css`
    :host {
        padding: 10px;
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 5px;
    }

    header {
        flex: 1;
        display: flex;
        gap: 5px;
        max-height: 64px;
    }

    header .returnButton {
        margin-top: auto;
        margin-bottom: auto;
        border-radius: 50%;
        background: lightgray;
        border: 0px;
        padding: 10px;
        aspect-ratio: 1;
        margin-left: 10px;
        margin-right: 10px;
    }

    header .returnButton:hover {
        background: #ABABAB;
    }

    h2 {
        text-align: left;
        display:none;
    }

    .tags {
        display: flex;
        gap: 5px;
    }

    .tags quick-note-tag {
        margin-top: auto;
        margin-bottom: auto;
    }

    .attachments {
        display: flex;
        gap: 5px;
        min-height: 64px;
        background: rgba(220,220,220, 00.2);
        border: 2px dashed gray;
    }

    button {
        
        aspect-ratio: 1/1;
        outline: none;
        border: 1px solid transparent;
        box-shadow: 0px 0px 9px 4px rgb(0 0 0 / 40%);
    }

    button.save {
        margin-left: 5px;
        margin-top: auto;
        margin-bottom: auto;
        padding:10px;
        border: 0px;
        background-color: var(--active-action-color);
        border-radius: 50%;
        color: white;
        
      }

    button.save svg {
        margin: auto;
    }


    .content {
        flex: 1;
    }

    .inputTitle {
        flex: 1;
        font-size: larger;
        background: transparent;
        border: 0px;
        margin-top: auto;
        margin-bottom: auto;
        padding-top: 5px;
        padding-bottom: 5px;
        background: transparent;
        border-color: transparent;
    }

    .inputTitle:focus {
        border: 0px;
        text-shadow: 2px 2px 7px #000000a6;
        font-style: italic;
    }

    header .inputTitle:not(:focus) {
        border-bottom: 1px solid gray;
    }

    .tags i, .attachments i {
        margin-top: auto;
        margin-bottom: auto;
        margin-right: 5px;
    }

    .tags .newTag {
        border-radius: 12px;
        border: 1px solid lightgray;
        background: white;
        color: black;
        display: flex;
        margin-top: auto;
        margin-bottom: auto;
        margin-left: auto;
        height: 24px;
    }

    .tags .newTag span:first-of-type {
        padding-left: 10px;
    }

    .tags .newTag span:last-of-type {
        padding-right: 10px;
    }

    .tags .newTag:focus-within {
        border: 1px solid yellow;
    }

    .tags .newTag input {
        background: transparent;
        border: 0px;
        outline: none;
    }

    .attachments {
        align-items: center;
        justify-content: center;
    }

    .attachments.highlight {
        background: #007e1e2e;
    }
    
    quick-note-attachment:hover {
        cursor: pointer;
    }

    button.refresh.attachment,
    button.refresh.tag {
        aspect-ratio: 1/1;
        margin-top: auto;
        margin-bottom: auto;
        border: 1px solid #494949;
        border-radius: 50%;
        line-height: 32px;
        font-size: 32px;
        color: white;
        width: 32px;
        height: 32px;
        outline: none;
        background-color: gray;
        padding: 0px;
        margin-right: 5px;
        margin-left: 5px;
    }

    button.refresh svg {
        width: 24px;
        height: 24px;
        margin-right: 2px;
    }
    
    .add {
        border: 1px solid #494949;
        border-radius: 50%;
        line-height: 32px;
        font-size: 32px;
        color: white;
        width: 32px;
        height: 32px;
        outline: none;
        background-color: gray;
        margin-top: auto;
        margin-bottom: auto;
        margin-right: 5px;
        margin-left: 5px;
        padding: 0px;
      }
  `];


  @state()
  private _note!: Note;

  set note(note: Note) {
    this._note = note;  
    this.attachmentsNeedToBeSaved = false;
    this.saveEnabled = false;
    if ( note === null || note === undefined ) {
        this.noteTitle = "";
        this.content = "";
        this.labels= [];
        this._attachments = new Map<string, Attachment>();
        this.createdAt = new Date();
        this.author = "";
        // if ( this.richTextEditor ) 
        //   (this.richTextEditor as any).value = "";
    } else {
        this.noteTitle = note.title;
        this.content = note.content;
        this.labels = [...note.labels];
        this._attachments = new Map<string, Attachment>(note._attachments);
        this.author = note.author;
        this.createdAt = note.createdAt;
        // if ( this.richTextEditor )
        //     (this.richTextEditor as any).value = this.content;
        this.requestUpdate();
        if ( this.inputTitle )
            this.inputTitle.focus(); 
    }
  }

  get note() {
    return this._note;
  }

  @state()
  private saveEnabled = false;

  @state()
  private noteTitle: string = "";

  @state()
  private content: string = "";

  @state()
  private labels: Array<Label> = [];

  @state()
  private _attachments: Map<string,Attachment> = new Map<string, Attachment>();

  @state()
  private author!: string;

  @state()
  private createdAt!: Date;


  @query(".inputTitle")
  private inputTitle!: HTMLInputElement;

  @query("tiny-mce")
  private tinyMce!: TinyMce;

  private handleEscapeKeyboard(e: KeyboardEvent) {
    if ( e.key === 'Escape') {
        let inputTarget = e.target instanceof HTMLInputElement ? e.target as HTMLInputElement : this.tinyMce;
        const noteAttribute = inputTarget.getAttribute("data-attribute") || "";
        inputTarget.value = (this as any)[noteAttribute];
    }

  }

  private onDataChanged(e: Event) {
    let inputTarget = e.target instanceof HTMLInputElement ? e.target as HTMLInputElement : this.tinyMce;
    const noteAttribute = inputTarget.getAttribute("data-attribute") || "";
    (this as any)[noteAttribute] = inputTarget.value;
    this.checkSaveEnabled();
  }

  attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
      if ( name === 'hidden' && !this.hidden ) {
        if ( this.shadowRoot ) {
            if ( this.inputTitle )
                this.inputTitle.focus();
        }
      }
  }

  // @query("tinymce-editor")
  // private editor!: Editor;

  @queryAll("quick-note-tag")
  private tags!: NodeListOf<HTMLElement>;
  
  @state()
  private labelsLength = -1;

  @query(".tags .newTag input.key")
  private newTagKey!: HTMLInputElement;

  @query(".tags .newTag input.value")
  private newTagValue!: HTMLInputElement;
  
  // @query("tinymce-editor")
  // private richTextEditor! : any;

  private resetLabels() {
    this.labels = this.note.labels;
    this.checkSaveEnabled();
  }

  private resetAttachments() {
    this._attachments = this.note._attachments;
    this.checkSaveEnabled();
  }

  private onSave() {
    const onlyAttachment = 
            !this.labelsNeedToBeSaved() && 
            !this.titleNeedsToBeSaved() && 
            !this.contentNeedsToBeSave() && 
            this.attachmentsNeedToBeSaved;

    this.note.title = this.noteTitle;
    this.note.author = this.author;
    this.note.content = this.content;
    this.note.labels = this.labels;
    //this.note._attachments = new Map<string, Attachment>();
    
    // deleted attachments
    this.note._attachments.forEach( (value, key) => {
        if ( [...this._attachments.keys()].indexOf(key) == -1 ) {
            this.note._attachments.get(key)!.length = -1;
        }
    });
    for(const entry of this._attachments.entries()) {
        this.note._attachments.set(entry[0], entry[1]);
    }

    this.dispatchEvent(new CustomEvent("save", { detail: {
        note: this.note,
        onlyAttachment: onlyAttachment
    }}));
  }


  private attachmentsNeedToBeSaved = false;

  private labelsNeedToBeSaved(): boolean {

    return (this.labels.some( (label) => this.note.labels.every( (origLabel) => 
        origLabel.key.toLowerCase() !== label.key.toLowerCase() || 
        origLabel.value.toLowerCase() !== label.value.toLowerCase())) &&
    this.note.labels.some( (origLabel) => this.labels.every( (label) => 
        origLabel.key.toLowerCase() !== label.key.toLowerCase() && 
        origLabel.value.toLowerCase() !== label.value.toLowerCase())))
    || this.labels.length != this.note.labels.length;
  }

  private titleNeedsToBeSaved(): boolean {
    return this.note.title !== this.noteTitle;
  }

  private contentNeedsToBeSave(): boolean {
    return this.note.content !== this.content;
  }

  private checkSaveEnabled() {
    this.saveEnabled = 
        this.titleNeedsToBeSaved() ||
        this.contentNeedsToBeSave() ||
        this.labelsNeedToBeSaved() ||
        this.attachmentsNeedToBeSaved;
        //!attachmentsAreEquals;
  }

  private addLabel() {
    if ( this.newTagKey.value === "" || this.newTagValue.value === "" ) return;
    this.labels = [...this.labels, {key: this.newTagKey.value, value: this.newTagValue.value}];
    this.newTagKey.value = "";
    this.newTagValue.value = "";
    this.checkSaveEnabled();
  }

  private deleteLabel(labelIndex: number) {
    this.labels = this.labels.filter((_,i) => i !== labelIndex);
    this.checkSaveEnabled();
  }

  private deleteAttachment(attachment: string) {
    this._attachments.delete(attachment);
    this.attachmentsNeedToBeSaved = true;
    this.checkSaveEnabled();
    this.requestUpdate();
  }

  private askForAttachmentDownload(attachment: string) {
    this.dispatchEvent(new CustomEvent("download", {detail: {doc:this.note, attachment: attachment}}))
  }

  private async handleOnDrop(ev: DragEvent) {
      ev.preventDefault();
      ev.stopPropagation();      
      this.unhighlightDnD(ev);

      Array.from(ev.dataTransfer?.items||[]).forEach( (item) => {
        if ( item.kind !== 'file' ) return;
        const file = item.getAsFile()!;
        this._attachments.set(file.name, {
            length: file.size || -1,
            revPos : -1,
            content_type: file.type||"",
            digest: "",
            data: file
        });
      });
      this.attachmentsNeedToBeSaved = true;
      this.checkSaveEnabled();
      this.requestUpdate();
  }

  @query("div.attachments")
  private dropZone!: HTMLDivElement;

  private async highlightDnD(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.add("highlight");
  }

  private async unhighlightDnD(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.remove("highlight");
  }

  private async handleOnDragOver(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.dropZone.classList.add("highlight");
    
  }

  render() {
    let attachments = this._attachments;
    if (attachments == undefined) attachments = new Map<string, Attachment>();
    let attach = [...attachments.keys()];

    return html`
        <header>
            <button class="returnButton" @click="${() => this.dispatchEvent(new CustomEvent("return"))}">${BackList}</button>
            <input autofocus class="inputTitle" data-attribute="noteTitle" @keydown=${this.handleEscapeKeyboard} @input=${this.onDataChanged} @change=${this.onDataChanged} type="text" .value="${this.noteTitle}"/>
            
            <button class="save" @click=${this.onSave} ?hidden=${!this.saveEnabled}>
                ${SaveIcon}
            </button>
        </header>
        <h2>Tags</h2>
        <div class="tags">
        ${this.labels.map( (label, index) => html`<quick-note-tag .key=${label.key} .value=${label.value} deletable @delete="${() => this.deleteLabel(index) }"></quick-note-tag>`)}
        <i ?hidden=${this.labels.length != 0}>No tags defined</i>
        <div class="newTag">
            <span><input type="text" class="key" placeholder="label"></span>
            <span>:</span>
            <span><input type="text" class="value" placeholder="value"></span>
        </div>
        <button class="add tag" @click=${this.addLabel}>+</button>
        <button class="refresh tag" @click=${this.resetLabels}>
            ${RefreshIcon}
        </button>
        </div>

        <h2>Content</h2>
        <tiny-mce 
          .value="${this.content}" 
          plugins="advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount" 
          toolbar="undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | print preview | help"        
            
          @keydown=${this.handleEscapeKeyboard} 
          
          @change=${this.onDataChanged}
          @input=${this.onDataChanged} 
          @blur=${this.onDataChanged}
          class="content"
          data-attribute="content"/>
        <tinymce-editor 
            menubar="false"
            @keydown="${() => console.log("on key down")}"
            on-blur="this.setValue"
            @FocusOut="${() => console.log("on focus out")}"
            data-attribute="content" 
            
            api-key="3cewlk31y5u5zvlne5wt4wwu00kuf5uolffmmk0wfxievcam" .content="${this.content}"></tinymce-editor>
        

        <!--<textarea @keydown=${this.handleEscapeKeyboard} @change="${this.onDataChanged}" @input=${this.onDataChanged} data-attribute="content" class="content" .value="${this.content}"></textarea>
        -->
        <h2>Attachments</h2>
        <div class="attachments" @dragenter=${this.highlightDnD} @dragover=${this.highlightDnD} @dragleave=${this.unhighlightDnD} @drop=${this.handleOnDrop}>
            <i ?hidden=${attach.length != 0}>No attachments defined</i>
            ${attach.map( (key) => html`
                <quick-note-attachment 
                    .title=${key} 
                    .attachment=${this._attachments?.get(key)}
                    @delete="${() => this.deleteAttachment(key)}"
                    @click="${() => this.askForAttachmentDownload(key)}">
                </quick-note-attachment>`)}
            <button class="add attachment">+</button>
            <button class="refresh attachment" @click=${this.resetAttachments}>
                ${RefreshIcon}
            </button>
        </div>
        <i>Created by ${this.author} - ${this.createdAt.toLocaleDateString(navigator.language, dateRenderingOptions)}</i>
    `;
  }
}


customElements.define('quick-note-detail', QuickNoteDetailPanel);