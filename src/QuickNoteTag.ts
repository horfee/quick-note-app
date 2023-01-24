import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { darken, getLuminance } from 'color2k';



export class QuickNoteTag extends LitElement {
  
  @property()
  key!: string;

  @property()
  value!: string;

  @property({ reflect: true, attribute: "deletable"})
  deletable: Boolean = false;

  @property()
  color: string = "#444444";

  static styles = css`
    :host {
      border-radius: 15px;
      height: auto;
      overflow: hidden;
      box-sizing: border-box;
      display: inline-flex;
    }   

    button {
      box-sizing: border-box;
      border: 0;
      border-left: 1px solid;
      margin: 2px 0px 2px 0px;
      cursor: pointer;
    }

    .key, .value {
      padding-top: 5px;
      padding-bottom: 5px;
    } 

    .key {
      padding-left: 5px;
    }

    .value {
      text-indent: 0.5em;
      padding-right: 5px;
    }

  `;

  render() {
    //console.log(this.deletable);
    const baseColor = this.color || "lightgray";
    const clr = darken(baseColor, 0.2);
    let fontColor = "#DDDDDD";
    if ( getLuminance(baseColor) > 0.5 ) {
      fontColor = "#333333";
    }
    return html`
        <style>
          :host {
            background: ${baseColor};
            border: 1px solid ${clr};
            color: ${fontColor}
          }

          button {
            background: ${baseColor};
            color: ${fontColor}
          }
        </style>
        <div class="key">${this.key}:</div><div class="value">${this.value}</div><button ?hidden=${this.deletable === false} @click="${ () => this.dispatchEvent(new CustomEvent("delete", {detail: {target: this}}))}">x</button>
    `;
  }
}


customElements.define('quick-note-tag', QuickNoteTag);