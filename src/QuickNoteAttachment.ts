import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { Attachment, Note } from './NoteDefinition';
import { getIconFromMIME } from './utils';

//const saveImage = new URL('../../assets/', import.meta.url).href;
const saveImage = "";

const byteValueNumberFormatter = Intl.NumberFormat(navigator.language, {
    notation: "compact",
    style: "unit",
    unit: "byte",
    unitDisplay: "narrow",
  });

export class QuickNoteAttachment extends LitElement {

  @property() 
  title: string = "";
  
  @property()
  attachment!: Attachment;

  static styles = css`
    :host {
        /*height: var(--size, 256px);*/
        width: var(--size, 256px);
        padding: 5px;
    }

    .container {
        border: 2px dashed lightgray;
        border-radius: 5px;
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        min-height: 100%;
    }

    .removeIcon {
        position: absolute;
        top: 0px;
        right: 0px;
        width: 25px;
        height: 25px;
        border-radius: 0px 5px 0px 0px;
        border: 1px solid #DD0000;
        background: red;
        /*font-size: 10px;*/
        line-height: 22px;
        cursor: pointer;
    }

    h1 {
        word-break: break-word;
        font-size: medium;
        
    }
  `;

  
  private onDeleteClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("delete", {detail: this.title}));
  }

  render() {
    return html`
        <div class="container">
            <div class="removeIcon" @click=${this.onDeleteClick}>x</div>
            <i>${byteValueNumberFormatter.format(this.attachment.length)}</i>
            <i class="fa-solid fa-user"></i>
            <img src="${saveImage}${getIconFromMIME(this.attachment.content_type)}.png"/>
            <h1>${this.title}</h1>
        </div>
    `;
  }
}

customElements.define('quick-note-attachment', QuickNoteAttachment);
