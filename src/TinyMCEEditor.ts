import { css, html, LitElement } from 'lit';
import { property, queryAsync } from 'lit/decorators.js';
import { TinyMCE, Editor } from 'tinymce';


const nativeEvents = ['beforepaste', 'blur', 'click', 'contextmenu',
'copy', 'cut', 'dblclick', 'drag', 'dragdrop', 'dragend',
'draggesture', 'dragover', 'drop', 'focus', 'focusin',
'focusout', 'keydown', 'keypress', 'keyup', 'mousedown',
'mouseenter', 'mouseleave', 'mousemove', 'mouseout', 'mouseover',
'mouseup', 'paste', 'selectionchange'];

export class TinyMce extends LitElement {
  
    private _tinyMce: TinyMCE;

    
    private _editor: Editor | undefined;
    
    private _editorPromise: Promise<Editor>;
    
    public get editor(): Editor | undefined {
        return this._editor;
    }

    
    @property() 
    plugins: string;

    @property() 
    toolbar: string;

    @property({ attribute:"read-only"})
    readOnly = false;

    @property({ attribute: "auto-focus"})
    autoFocus = false;
    
    constructor() {
        super();
        this.plugins = "";
        this.toolbar = "";
        this._editorPromise = new Promise( (resolve, reject) => {
            const self = this;
            this.textArea?.then( (target) => {
                this._tinyMce.init({
                    toolbar: this.toolbar,
                    plugins: this.plugins,
                    fullscreen_native: false,
                    language_url: '/assets/tinymce/langs/' + navigator.language,   
                    readonly: this.readOnly,
                    auto_focus: this.autoFocus ? true: "",
                    base_url: "node_modules/tinymce",
                    target: target,
                    setup: (editor: Editor) => {
                        this._editor = editor;
                        editor.on("SwitchMode", () => console.log("here"));
                        resolve(editor);
                        //nativeEvents.forEach( (ev: string) => editor.on(ev, this._handleEvent.bind(self)));
                    }
                });
            });
            
        });
        this._tinyMce = (globalThis as any).tinymce;
    }

    @queryAsync("textarea")
    private textArea: Promise<HTMLTextAreaElement|undefined> | undefined;

    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
        if ( nativeEvents.indexOf(type) >= 0 ) {
            this._editorPromise.then( (editor) => {
                const ctx = ((listener as any).options as any).host;
                (this._editor as any).on(type, (options as Function).bind(ctx));
            })
        } else {
            super.addEventListener(type, listener, options);
        }
    }

    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
        if ( nativeEvents.indexOf(type) >= 0 ) {
            this._editorPromise.then( (editor) => {
                (this._editor as any).off(type, options, listener);
            })
        } else {
            super.removeEventListener(type, listener, options);
        }
    }

    // addEventListener() {
    //     super.addEventListener()
    // }

    get value(): string {
        return this._editor?.getContent()||"";
    }

    set value(value: string) {
        this._editor?.setContent(value);
    }

    // private _handleEvent(ev: Event) {
    //     this.dispatchEvent(new Event(ev.type, Object.assign(ev, {target: this, editor: ev.target})));
    // }

    static styles = css`
      :host {
      }
      
    `;
  
    render() {
        return html`
            <textarea/>
        `;
    }
    
  }
  
  customElements.define('tiny-mce', TinyMce);