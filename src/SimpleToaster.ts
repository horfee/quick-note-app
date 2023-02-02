import { css, html, LitElement } from 'lit';
import { property, queryAsync } from 'lit/decorators.js';

 
type Position = "top-right" | "top-left" | "bottom-right" | "bottom-left";
type AnimationSpeed = "slow" | "normal" | "fast";

export class SimpleToaster extends LitElement {
  

    @property({attribute: true, reflect: true})
    position: Position = "top-right";

    @property() 
    animationDuration: number | AnimationSpeed = "normal";

    @property()
    displayDuration: number = 3.0;

    @property({type: Boolean, reflect: true}) 
    show = false;

    @property({type: Boolean, reflect: true})
    persistent = false;

    static styles = css`
      :host {
        position: fixed;
      }

      section {
        margin: 15px;
      }
      
      :host([position="top-right"]) {
        right: 0px; 
        top: 0px;
      }

      :host([position="top-left"]) {
        left: 0px; 
        top: 0px;
      }

      :host([position="bottom-right"]) {
        right: 0px; 
        bottom: 0px;
      }

      :host([position="bottom-left"]) {
        left: 0px; 
        bottom: 0px;
      }

      /*
      :host(   
        :not([show])
        :not(:has(section[animating])) 
            ) {
        display: none;
      }*/

      @keyframes fadeIn {
        0% {
            display: none;
            opacity: 0;
        }

        100% {
            display: initial;
            opacity: 1;
        }
      }


      @keyframes fadeOut {
        100% {
            display: initial;
            opacity: 0;
            display: none;
        }

        0% {
            display: initial;
            opacity: 1;
        }
      }
    `;

    private _timeOut: any;

    attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        super.attributeChangedCallback(name, _old, value);

        if ( name === "show" ) {
            if ( this._timeOut ) clearTimeout(this._timeOut);
            if ( value === "" && this.persistent === false) {
                this._timeOut = setTimeout(() => {
                    this.show = false;
                }, (this.displayDuration + this.resolveAnimationDuration()) * 1000);
            }
        } else if ( name === "persistent" ) {
            if ( value === "" && this._timeOut ) {
                clearTimeout(this._timeOut);
                this._timeOut = undefined;
            } else if ( value === null && this.show === true ) {
                this._timeOut = setTimeout(() => {
                    this.show = false;
                }, (this.displayDuration + this.resolveAnimationDuration()) * 1000);
            }
        }
    }
  
    private resolveAnimationDuration() {
        return (typeof(this.animationDuration) === 'number' ) ? this.animationDuration : 
        this.animationDuration === "slow" ? 1:
        this.animationDuration === "fast" ? 0.1: 0.5;
    }
    render() {

        const duration = this.resolveAnimationDuration() + "s";

        return html`
            <style>
                :host(:not([show])) {
                    animation: fadeOut ${duration} forwards;
                    pointer-events: none;
                }

                :host([show]) {
                    animation: fadeIn ${duration} forwards;
                }
            </style>

            <section>
                <slot>
                    Fallback
                </slot>
            </section>
        `;
    }
    
  }
  
  customElements.define('simple-toaster', SimpleToaster);