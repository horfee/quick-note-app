import { msg } from '@lit/localize';
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { AttachmentIcon, DeleteIcon } from '../assets/icons';
import { Note } from './NoteDefinition';
import { dateRenderingOptions } from './utils';

const deleteIcon = new URL('../../assets/deleteIcon.svg', import.meta.url).href;
const attachmentsIcon = new URL('../../assets/attachmentIcon.svg', import.meta.url).href;

export class QuickNoteItem extends LitElement {

  @property({hasChanged(value: Note, oldValue: Note) {
    return ((value !== null && value !== undefined ) && oldValue === undefined ) ||
            (value._id != oldValue._id || value._rev != oldValue._rev);
  },}) note?: Note;
  
  static styles = css`
    :host {
      margin: 0;
      padding: 5px;
      width: 100%;
      cursor: pointer;

      box-sizing: border-box;
      display: grid;
      grid-template-columns: auto 1fr auto  auto;
      grid-template-rows: 1fr 1fr;
      grid-column-gap: 0px;
      grid-row-gap: 0px;

      transition: background-color 0.1s;
    }
    
    .attachments[hidden] {
      display: unset;
      visibility: hidden;
    }

    .title { 
      text-align: left;
      font-size: large;
      margin: 0;
      grid-row-start: 1;
      grid-column-start: 1;
   
      grid-row-end: 2;
      grid-column-end: 3;
    }

    .attachments { 
      grid-row-start: 1;
      grid-column-start: 3;

      grid-row-end: 2;
      grid-column-end: 4;

      margin: 0px 3px 1.5px 3px;
      height: 32px;
      display: flex;
      justify-content: flex-end;
      position: relative;
    }

    .attachments div {
        --inner-padding: 1px;
        --inner-size: 26px;
        position: relative;
        top: 5px;
        left: 10px;
        border: 1px solid gray;
        background: rgba(255, 255, 255, 0.5);
        border-radius: calc(var(--inner-size)/2 + var(--inner-padding)*2);
        min-width: var(--inner-size);
        color: black;
        height: var(--inner-size);
        font-size: small;
        line-height: var(--inner-size);
        padding: var(--inner-padding);
    }

    .attachments svg {
        height: 100%;
        width: 32px;
    }

    .createdAt {
      margin: 0;
      text-align: left;
      border-right: 1px solid gray;
      padding-right: 5px;

      grid-row-start: 2;
      grid-column-start: 1;
   
      grid-row-end: 3;
      grid-column-end: 2;
    }

    .content {
      margin: 0 3px 0 5px;
      text-align: left;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      grid-row-start: 2;
      grid-column-start: 2;

      grid-row-end: 3;
      grid-column-end: 3;
    }

    .author {
      margin: 1.5px 3px 0px 3px;
      text-align: right;
      
      grid-row-start: 2;
      grid-column-start: 3;

      grid-row-end: 3;
      grid-column-end: 4;
    }

    .edit {
      grid-row-start: 1;
      grid-row-end: 2;

      grid-column-start:4;
      grid-column-end:5;
    }

    .delete {
      grid-row-start: 1;
      grid-row-end: 3;

      grid-column-start:4;
      grid-column-end:5;

      margin: auto;
      margin-left: 10px;
      padding: 2px;
      border: 0px;
      display: inherit;
      border-radius: 50%;
      background: transparent;

      transform: scale(1);
      transition: transform 0.2s;
    }

    .delete:hover {
        background: #FFFFFFF0;
        color: rgb(105, 43, 43);;
    }

    /*.delete:hover img {
        transform: rotate(90deg);
        transition: transform 0.2s;
    }

   */

    .deleteIcon {
        margin: 0px;
       
    }

    .delete:hover {
        transform: scale(1.2);
    }

    .deleteIcon .top {
        transition: transform 0.2s;
        transform-origin:bottom;
        animation: closeTrash 0.5s forwards;
    }

    .deleteIcon:hover .top {
        animation: openTrash 0.5s forwards;
    }

    @keyframes openTrash {
        0% {
            transform: translateY(50px);
        }

        50% {
            transform:  translateY(0px);
        }
        100% {
            transform:  translate(0px) rotate(15deg);
        }
    }

    @keyframes closeTrash {
        100% {
            transform:  translateY(50px);
        }
        50% {
            transform:  translateY(0px);
        }
        0% {
            transform: translate(0px) rotate(15deg);
        }
    }

    quick-note-tag {
        font-size: 10px;
        margin-right: 2px;
    }
  `;

  

  private onDeleteClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("delete", {detail: this.note}));
  }

  render() {
    const attachments = [...this.note!._attachments.entries()];
    const content = document.createElement("div");
    
    content.innerHTML = this.note?.content;
    
    return html`
        <h2 class="title">${this.note?.title}&nbsp;${(this.note?.labels||[]).map( (label) => html`<quick-note-tag .key=${label.key} .value=${label.value}></quick-note-tag>`)}</h2>
        <div class="attachments" ?hidden=${attachments.length == 0}>
            <div>${attachments.length}</div>
            ${AttachmentIcon}
        </div>
        <p class="createdAt">🕘 ${this.note?.createdAt.toLocaleDateString(navigator.language, dateRenderingOptions)}</p>
        <p class="content">${content.innerText}<i class="noContent" ?hidden=${this.note?.content !== undefined && this.note?.content !== ''}>${msg('No content')}</i></p>
        <p class="author">${this.note?.author}</p>
        <button class="delete" @click=${this.onDeleteClick}>
            ${DeleteIcon}
        </button>
    `;
  }
}

customElements.define('quick-note-item', QuickNoteItem);
