import { LitElement, html, css, PropertyValues } from 'lit';
import { property, state } from 'lit/decorators.js';

export class QuickNoteDialog extends LitElement {
    
  
  static styles = css`
      :host {
        position: fixed;
      }

      :host(:not([backdrop])) {
        left: 50%;
        top: 50%;
        transform: translateX(-50%) translateY(-50%);
      }
      
      :host([backdrop]) {
        height: 100vh;
        width: 100vw;
        display: flex;

        color: #000;
        background: rgb(160 160 160 / 68%);
        backdrop-filter: blur(2px);
      }

      :host(:not([open])) {
        display: none;
      }

      .dialog {
        background: rgb( 220, 220, 220);
        padding: 15px;
        margin: auto;
      }
      
      .titlebar {
        display: flex;
      }

      .close {
        margin-left: auto;
      }

      .dialog {
        box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
        transition: all 0.3s cubic-bezier(.25,.8,.25,1);
      }
      
      
      .dialog:hover {
        box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
      }
    `;
  
  
  firstUpdated() {
    this._watchEscape = this._watchEscape.bind(this);
  }
  
  render() {
    return html`
      <div class="dialog" role="dialog" aria-labelledby="title" aria-describedby="content">
        <div class="titlebar">
            <slot name="heading"></slot>
            <button ?hidden=${!this.closeable} class="close" aria-label="Close" @click=${this.close}>✖️</button>
        </div>
        <div id="content" class="content">
          <slot></slot>
        </div>
    </div>
    `;
  }
  

  @state()
  private _wasFocused?: HTMLElement;

  @property({type: Boolean, reflect: true, attribute: 'closeable'})
  closeable : boolean = false;

  @property({type: Boolean, reflect: true, attribute: 'open'})
  open: boolean = false;

  @property({type: Boolean, reflect: true})
  backdrop: boolean = false;

  updated(_changedProperties: PropertyValues) {
        if (this.closeable ) {
            if ( this.open ) {
                document.addEventListener('keydown', this._watchEscape);
            } else {
                document.removeEventListener('keydown', this._watchEscape);
            }
        }
  }
  
  close() {
    this.open = false;
    const closeEvent = new CustomEvent('dialog-closed');
    this.dispatchEvent(closeEvent);
  }
  

  _watchEscape(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        this.close();   
    }
  }
}

customElements.define('quick-note-dialog', QuickNoteDialog);