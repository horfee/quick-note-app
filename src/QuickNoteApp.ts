import { LitElement, html, css } from 'lit';
import { until } from 'lit/directives/until.js';
import {when} from 'lit/directives/when.js';
import { property, query, state } from 'lit/decorators.js';
import { Note } from './NoteDefinition';
import { QuickNoteDialog } from './QuickNoteDialog';
import '@lit-labs/virtualizer';
import './QuickNoteItem';
import './QuickNoteDialog';
import './QuickNoteSearchBar';
import './QuickNoteDetailPanel';
import { hexEncode, noteToJSON, objectsToNotes, objectToNote } from './utils';
import { CouchDB, CouchError } from './couchdb';
import { LogoutIcon, QuickNoteIcon } from '../assets/icons';
import { toHsla } from 'color2k';

export class QuickNoteApp extends LitElement {

  @property({ type: String }) title = 'Quick notes';

  static styles = css`
    :host {
      --active-action-color: #00b912;;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      justify-content: flex-start;
      margin: 0 auto;
      text-align: center;
    }

    main {
      flex-grow: 1;
      display: flex;
      color: var(--theme-font-dark-color);
    }

    .logo svg {
      overflow: visible;
    }

    .logo .pen {
      fill: var(--theme-primary-dark-color);
      animation: 3s linear 0s infinite alternate animatePen;
      transform-origin: bottom right;
    }

    @keyframes animatePen {
      0% {
        transform: translateX(-15px) rotate(0deg);
      }
      10% {
        transform: translateX(-14px) translateY(2px) rotate(2deg);
      }
      20% {
        transform: translateX(-12px) translateY(-2px) rotate(-2deg);
      }
      30% {
        transform: translateX(-10px) translateY(2px) rotate(2deg);
      }
      40% {
        transform: translateX(-8px) translateY(-2px) rotate(-2deg);
      }
      50% {
        transform: translateX(-6px) translateY(2px) rotate(2deg);
      }
      60% {
        transform: translateX(-4px) translateY(-2px) rotate(-2deg);
      }
      70% {
        transform: translateX(-2px) translateY(2px) rotate(2deg);
      }
      80% {
        transform: translateX(0px) translateY(-2px) rotate(-2deg);
      }
      90% {
        transform: translateX(2px) translateY(2px) rotate(2deg);
      }
      100% {
        transform: translateX(5px) rotate(0deg);
      }
    }


    @media (prefers-color-scheme: dark) {
      :host {
        background-color: var(--theme-primary-light-color);
        color: var(--theme-font-dark-color);
      }

      header {
        background-color: var(--theme-primary-dark-color);
      }
    }
    @media (prefers-color-scheme: light) {
      :host {
        background-color: var(--theme-secondary-light-color);
        color: var(--theme-font-light-color)
      }

      header {
        background-color: var(--theme-primary-light-color);
      }
    }

    header {
      display: flex;
      flex-direction: row;
      gap: 5px;
      height: 54px;
      align-items: center;
      padding: 5px;
    }

    header .logo {
    }

    header .logo,
    header .logo img {
      height: 100%;
    }

    header h1 {
      margin: 0;
      margin-right:auto;
    }

    header h2 {
      margin-left: 5px;
    }

    #list {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    #list list-virtualizer {
      flex: 1;
    }

    #list[hidden] {
      display: none;
    }

    #details[hidden] {
      display: none;
    }


    quick-note-item:hover {
      background-color: var(--active-action-color);
    }

    quick-note-item {
      border-top: 1px solid gray;
    }

    quick-note-item:last-of-type {
      border-bottom: 1px solid gray;
    }

    .boxShadow {
      box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
    }

    .login {
      margin:auto;
      background: #DDDDDD;
      padding: 20px;
      border-radius: 5px;
      border: 1px solid var(--theme-primary-dark-color);
    }

    .login input,
    .login .loginMessage {
      font-size: larger;
    }

    .login {
      color: var(--theme-font-light-color);
    }

    .login form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .login form input[type="submit"] {
      margin-left: auto;
    }

    .createNewNote {
      box-shadow: 0px 0px 9px 4px rgb(0 0 0 / 40%);
      border: 1px solid transparent;
      border-radius: 50%;
      line-height: 32px;
      font-size: 32px;
      color: white;
      width: 32px;
      height: 32px;
      outline: none;
      padding: 0px;
      background-color: var(--active-action-color);
    }

    .createNewNote:focus {
        border: 1px solid darkgreen;
    }

    .logout {
      border: 1px gray;
      border-radius: 50%;
      aspect-ratio: 1/1;
      width: 32px;
      height: 32px;
      padding: 3px;
      box-shadow: 0px 0px 9px 4px rgb(0 0 0 / 40%);
      margin-bottom: auto;
      margin-top: auto;
      margin-left: 10px;
      margin-right: 10px;
    }

    .logout svg {
      height: 100%;
      width: 100%;
      aspect-ratio: 1/1;
    }
  `;

  @property( {type: Array}) notes: Note[] = [];

  @state() 
  protected selected: Note|undefined;

  @query("#confirmDeleteDialog")
  private confirmDeleteDialog?: QuickNoteDialog;


  private _couchDB?: CouchDB;

  @state()
  menuOpened: boolean = false;

  @state()
  loggedIn: boolean = false;

  @state()
  loginMessage: string|undefined;

  @state()
  username : string = "";

  @state() 
  private fetchingNotes: boolean = false;

  @query(".login form")
  loginForm!: HTMLFormElement;


  private noteToDelete: Note|undefined;

  public askForDeleteNote(note: Note) {
    this.confirmDeleteDialog!.open = true;
    this.noteToDelete = note;
  }

  private async _deleteNote() {
    if ( this.noteToDelete === undefined ) return;

    const res = await this._couchDB?.deleteDocument(this.noteToDelete);
    if ( res && res.ok && res.ok === true ) {
      this.notes = this.notes.filter( (note) => note._id !== this.noteToDelete?._id && note._rev !== this.noteToDelete?._rev);
      this.noteToDelete = undefined;
    }

  }

  private createNote() {
    this.selected = {
      _id: undefined,
      _rev: undefined,
      title: "",
      author: this.username,
      createdAt: new Date(),
      content: "",
      labels: [],
      _attachments: new Map()
    };

  }

  private showMenu() {
    this.menuOpened = true;
  }

  async connectedCallback() {
    super.connectedCallback();

      try {
        this._couchDB = await CouchDB.connect("/api") as CouchDB;

        if ( this._couchDB === undefined || this._couchDB.username === undefined || this._couchDB.username === "") return;

        await this._couchDB.useDatabase("userdb-" + hexEncode(this._couchDB.username));
        this.loggedIn = true;
        this.username = this._couchDB.username;
        setTimeout( () => {
          (this.shadowRoot?.querySelector("button.createNewNote") as HTMLButtonElement).focus();
        }, 0);
        this.fetchNotes();
       
      } catch (error) {
        const couchError = error as CouchError;
        if ( couchError && couchError.error.status >= 500 ) {
          this.loggedIn = false;
          this.loginMessage = "Service unavailable. Please contact the administrator";
        }
      }
      
  }

  private async login(e: Event) {
    e.preventDefault();
        
    const formData = new FormData(this.loginForm);
    const _username = formData.get("username") as string;
    const _password = formData.get("password") as string;
    try {
      this._couchDB = await CouchDB.connect({server: "/api", username: _username, password: _password});
      if ( this._couchDB == undefined ) {
        this.loggedIn = false;
        this.loginMessage = 'Incorrect credentials';
        return;
      }

      try {
        await this._couchDB.useDatabase("userdb-" + hexEncode(_username));
        this.loggedIn = true;
        this.loginMessage = undefined;
        this.username = _username;
        this.fetchNotes();
      } catch (error) {
        console.log(error);
      }
      
    } catch (err ) {
      const couchError = err as CouchError;
      this.loggedIn = false;
      if ( couchError.error.status == 401) {
        this.loginMessage = 'Access unauthorized';
      } else {
        this.loginMessage = couchError.message;
      }
    } 
    return false;
  }

  private handleError(error: CouchError) {

  }

  private async  fetchNotes( query?: any): Promise<void> {
    setTimeout( () => this.fetchingNotes = true, 0);
    if ( query === undefined || query.selector === undefined ) {
      query = { selector:{} };
    }

    try {
      const notes : any = await this._couchDB?.getDocuments(query);
  
      this.notes = objectsToNotes(notes.docs);
      this.fetchingNotes = false;
    } catch (error) {
      this.handleError(error as CouchError);
    }
  }

  private async _saveNote(note: Note, onlyAttachment: boolean) {
    const jsonNote = {...noteToJSON(note)};
    const origNote = {_id: note._id, _rev: note._rev};
    let res;
    let isNew;

    // update main document
    if ( note._id === undefined )  {    // create new record
      res = await this._couchDB?.newDocument(jsonNote);
      origNote._id = res.id;
      origNote._rev = res.rev;
      isNew = true;
    } else {                            // update existing record
      if ( !onlyAttachment ) {
        res = await this._couchDB?.updateDocument(jsonNote);
        origNote._rev = res?.rev;
      }
      isNew = false;
    }

  
    let revertToNote = false;
    for(const attachEntry of [...note._attachments.entries()]) {
      if ( attachEntry[1].length == - 1 ) {
        const deleteFile = await this._couchDB?.deleteAttachment({documentId: origNote._id!, rev: origNote._rev!, fileName: attachEntry[0]});
        if ( !deleteFile || deleteFile.ok !== true ) {
          revertToNote = true;
          break;
        }
//        origNote._attachments.delete(attachEntry[0]);
        origNote._rev = deleteFile.rev;
        
      } else if ( attachEntry[1].digest === "" ) {
        const uploadFile = await this._couchDB?.uploadAttachment({documentId: origNote._id!, rev: origNote._rev!, file: attachEntry[1].data});
        if ( !uploadFile || uploadFile.ok !== true ) {
          revertToNote = true;
          break;
        }
        origNote._rev = uploadFile.rev;
      }
    };

    if ( revertToNote ) {
      console.log("muse revert to previous revision");
      return;
    }
    
    let n;
    try {
      n = objectToNote(await this._couchDB?.getDocument(origNote._id!, origNote._rev));
    } catch( error ) {
      this.showToaster(html`An error happened. Click <a @click=${this.fetchNotes}>here</a> to refresh`);
      return;
    }
    if ( n === undefined ) return;

    if ( isNew ) {
      this.notes.push(n);
    } else {
      const ind = this.notes.findIndex( (n: Note) => n._id === note._id && n._rev === note._rev);
      this.notes.splice(ind, 1, n);
    }
    this.requestUpdate();
    this.selected = undefined;
    
  }

  private showToaster(content: any) {

  }

  private async downloadAttachment(e: CustomEvent) {
    const res = await this._couchDB?.downloadAttachment({documentId: e.detail.doc._id, rev: e.detail.doc._rev, attachment: e.detail.attachment});
    const file = window.URL.createObjectURL(await res!.blob());
    //window.location.assign(file);
    const a = document.createElement("a");
    a.href = file;
    a.download = e.detail.attachment;;
    a.click();
    window.URL.revokeObjectURL(file);
  }

  private async logout() {
    await this._couchDB?.disconnect();
    this.loggedIn = false;
  }


  private selectDatabase() {
    const db = (this.shadowRoot?.querySelector("select#selectDatabase") as HTMLSelectElement).value;
    this._couchDB?.useDatabase(db);
  }

  render() {
    return html`
      <header>
        <div class="logo">${QuickNoteIcon}
        </div>
        <h1 >${this.title}</h1>
        <button class="spaceMe createNewNote" ?hidden=${!this.loggedIn} @click=${this.createNote}>+</button>
        <button class="spaceMe logout" ?hidden=${!this.loggedIn} @click=${this.logout}>${LogoutIcon}</button>
      </header>
      <main>

        <!-- LOGIN DIALOG -->
        <div class="login boxShadow" ?hidden=${this.loggedIn}>
          <h2><i>Welcome in Quick Notes</i></h2>
          <form @submit=${this.login} >
            <input type="text" placeholder="Username" name="username" id="username"/>
            <input type="password" placeholder="Password" name="password" id="password"/>
            <input type="submit" value="Login"/>
            <div ?hidden=${this.loginMessage === undefined} class="loginMessage">${this.loginMessage}</div>
          </form>
        </div>
        <!-- END OF LOGIN DIALOG -->

        <!-- DETAIL OF A NOTE -->
        <quick-note-detail 
            id="details" 
            ?hidden=${!this.selected || !this.loggedIn}
            .note=${this.selected}
            @return="${ () => this.selected = undefined}"
            @save="${ (e: CustomEvent) => this._saveNote(e.detail.note, e.detail.onlyAttachment)}"
            @download="${ this.downloadAttachment}"
        ></quick-note-detail>
        <!-- END OF DETAIL OF A NOTE -->

        <!-- LIST OF NOTES -->
        <div ?hidden=${this.selected !== undefined || !this.loggedIn} id="list">
          <quick-note-search-bar @search="${(e: CustomEvent) => this.fetchNotes(e.detail)}"></quick-note-search-bar>
          <div ?hidden=${!this.fetchingNotes}>Fetching notes</div>
          <lit-virtualizer ?hidden=${this.fetchingNotes} id="list"
            scroller
            .items=${this.notes}
            .renderItem=${ (note: Note) => html`
                <quick-note-item 
                      .note=${note} 
                      @click=${ () => this.selected = note }
                      @delete=${ (e: CustomEvent) => this.askForDeleteNote(note)}
                >
                </quick-note-item>`}
          </lit-virtualizer>
          <!--
          ${this.notes.map( (note: Note) => html`
                  <quick-note-item 
                  .note=${note} 
                  @click=${ () => this.selected = note }
                  @delete=${ (e: CustomEvent) => this.askForDeleteNote(note)}
            >
            </quick-note-item/>
          `)}-->
          <!-- END OF LIST OF NOTES -->


        </div>
      </main>
      <!-- SELECT DB DIALOG -->
      <quick-note-dialog id="selectDB" ?open="${this.loggedIn && this._couchDB?.currentDatabase === ""}">
        <h2 slot="heading">Select a database</h2>
        <select id="selectDatabase" style="width: 100%">
        ${ when( this._couchDB?.currentDatabase === "",

        
            () => until( this._couchDB?.getDatabases().then( (dbs) => dbs.map( (db: string) => html`
              <option value="${db}">${db}</option>
            `) ) )
          )
          
        }
        </select>
        <div style="display: flex; justify-content: flex-end; padding: 3px;">
          <button @click=${this.selectDatabase}>Select</button>
        </div>
        
      </quick-note-dialog>
      <!-- SELECT DB DIALOG -->

      <quick-note-dialog backdrop id="confirmDeleteDialog">
        <h2 slot="heading">Confirm deletion</h2>
        <p>Do you really want to delete note <i><u>${this.selected?.title}</u></i> ?</p>
        <div style="display: flex; justify-content: flex-end; padding: 3px;">
          <button style="margin-right: 2px;" @click=${() => { this.confirmDeleteDialog?.close(); this._deleteNote()}}>Yes</button>
          <button style="margin-left: 2px;" @click=${() => this.confirmDeleteDialog?.close()}>No</button>
        </div>
      </quick-note-dialog>
      <footer>
        Copyleft
      </footer>
    `;
  }
}


customElements.define('quick-note-app', QuickNoteApp);