import { LitElement, html, css, PropertyValueMap } from 'lit';
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
import { ConnectionWithoutPasswordError, CouchDB, CouchError, NotConnected } from './couchdb';
import { LogoutIcon, QuickNoteIcon } from '../assets/icons';
import { toHsla } from 'color2k';
import './SimpleToaster';
import { SimpleToaster } from './SimpleToaster';
import { QuickNoteTag } from './QuickNoteTag';
import { QuickNoteSearchBar } from './QuickNoteSearchBar';
import {configureLocalization, localized, msg} from '@lit/localize';

const {setLocale} = configureLocalization({
  sourceLocale: 'en',
  targetLocales: ['en', 'fr', 'fr-FR'],
  loadLocale: (locale) => import(`/out-tsc/src/generated/locales/${locale}.js`),
});

setLocale(navigator.language);

@localized()
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

    header .spaceMe.selectDatabase {
      margin: 5px;
    }

    header .spaceMe.selectDatabase select {
      padding: 5px;
      background: transparent;
      color: white;
      border: 1px solid white;
      border-radius: 5px;
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

    .toasted {
      box-shadow: 0px 0px 9px 4px rgb(0 0 0 / 40%);
      padding: 10px;
      border-radius: 5px;
      border: 2px solid rgb(0, 153, 0);
      background: rgb(137 222 137 / 95%);
    }

    .sort > quick-note-tag {
      height: 36px;
    }

    .sort quick-note-tag:last-of-type {
      margin-right: auto;
    }

    .sort {
      display: flex;
    }

    .sort span {
      margin-top: auto;
      margin-bottom: auto;
      padding: 5px;
    }

    .fetchingIndicator {
      position: fixed;
      top: 0px;
      left: 50%;
      transform: translateX(-50%);
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

  @state()
  private encryptionKey: string|undefined;

  @query(".login form")
  loginForm!: HTMLFormElement;

  @query("simple-toaster")
  toaster!: SimpleToaster;

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
      encrypted: false,
      _attachments: new Map()
    };

  }

   
  protected updated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void {
    if (_changedProperties.has("selected") ) {
      const queryParams = new URL(window.location.toString());
      const id = this.selected?._id||"";
      if ( id !== "" && id !== queryParams.searchParams.get("id") ) {
        queryParams.searchParams.set("id", id);
        window.history.pushState({}, "", queryParams.toString());
        
      } else if (id === "" ) {
        queryParams.searchParams.delete("id");
        window.history.pushState({}, "", queryParams.toString());
      }
      
    }
  }
  
  //   super.attributeChangedCallback(name, _old, value);
  //   if ( name === 'selected' ) {
  //     
      
  //   }
  // }

  private _selectNoteFromURL(url: URL) {
    const queryParam = url.searchParams;
    if ( queryParam.get("id") !== undefined && queryParam.get("id") !== "" ) {
      this.selected = this.notes.find( (n: Note) => n._id === queryParam.get("id"));
    }
    
  }
  
  async connectedCallback() {
    super.connectedCallback();

      window.addEventListener("popstate", (ev: PopStateEvent) => {
        this._selectNoteFromURL(new URL(window.location.toString()));
      });

      try {
        this._couchDB = await CouchDB.connect("/api") as CouchDB;

        if ( this._couchDB === undefined || this._couchDB.username === undefined || this._couchDB.username === "") return;
        this.loggedIn = true;
        this.username = this._couchDB.username;        
        if ( this._couchDB.currentDatabase === "" ) {
          await this._couchDB.useDatabase("userdb-" + hexEncode(this._couchDB.username));
        }
        setTimeout( () => {
          (this.shadowRoot?.querySelector("button.createNewNote") as HTMLButtonElement).focus();
        }, 0);
        await this.fetchNotes();
        this._selectNoteFromURL(new URL(window.location.toString()));
      } catch (error) {
        const couchError = error as CouchError;
        if ( couchError && couchError.error.status >= 500 ) {
          this.loggedIn = false;
          this.loginMessage = msg("Service unavailable. Please contact the administrator");
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
        this.loginMessage = msg('Incorrect credentials');
        return;
      }

      this.loggedIn = true;
      this.loginMessage = undefined;
      this.username = _username;

      try {
        await this._couchDB.useDatabase("userdb-" + hexEncode(_username));
        await this.fetchNotes();
      } catch (error) {
        console.log(error);
        await this.fetchNotes();
      } finally {
        this._selectNoteFromURL(new URL(window.location.toString()));
      }
      
    } catch (err ) {
      const couchError = err as CouchError;
      this.loggedIn = false;
      if ( couchError.error.status == 401) {
        this.loginMessage = msg('Access unauthorized');
      } else {
        this.loginMessage = couchError.message;
      }
    } 
    return false;
  }

  private async handleError(error: CouchError) {
      console.log(error);
      if ( error === NotConnected ) {
        try {
          await this._couchDB?.reconnect();
        } catch (error: any ) {
          if ( error === ConnectionWithoutPasswordError ) {
            this.showToaster(html`${msg('You are not connected anymore. You need to provide your credentials again.')}`);
            this.loggedIn = false;
          } else {
            this.showToaster(error.message);
            this.loggedIn = false;
          }
        }
      } else {
        this.showToaster(error.message);
      }
      


  }

  private async  fetchNotes( query?: any): Promise<void> {
    setTimeout( () => this.fetchingNotes = true, 0);
    if ( query === undefined || query.selector === undefined ) {
      query = { selector:{} };
    }

    // query.sort = [];

    // for(const tag of Array.from(this.shadowRoot?.querySelectorAll("div.sort > quick-note-tag")||[])) {
    //   const t = tag as QuickNoteTag;
    //   if ( t.value === "⬆" ) {
    //     query.sort.push({[t.key.toLowerCase().replace(" ","")]: "asc"});
    //   } else if ( t.value === "⬇" ) {
    //     query.sort.push({[t.key.toLowerCase().replace(" ","")]: "desc"});
    //   }
    // };

    try {
      const notes : any = await this._couchDB?.getDocuments(query);
  
      this.notes = objectsToNotes(notes.docs);

      const sorter = Array.from(this.shadowRoot?.querySelectorAll("div.sort > quick-note-tag")||[]).filter( (t) => (t as QuickNoteTag).value !== "")[0];
      if ( sorter !== undefined ) {
        let field : string= (sorter as QuickNoteTag).key.toLowerCase().replace(" ", "");
        const asc = (sorter as QuickNoteTag).value === "⬆";
        const desc = (sorter as QuickNoteTag).value === "⬇";
        if ( !asc && !desc ) return;

        field = { "createdat": "createdAt",
                  "author": "author",
                  "title": "title",
                  "encrypted": "encrypted"  
                }[field]||"";
        this.notes = this.notes.sort( (a: Note, b: Note) => {
          return (asc ? 1 : -1 ) * ((a as any)[field] < (b as any)[field] ? -1 : (a as any)[field] > (b as any)[field] ? 1 : 0)
        });
      }
    } catch (error) {
      this.handleError(error as CouchError);
    } finally {
      this.fetchingNotes = false;
    }
  }

  private async _saveNote(note: Note, onlyAttachment: boolean) {
    const jsonNote = {...noteToJSON(note)};
    const origNote = {_id: note._id, _rev: note._rev};
    let res;
    let isNew;

    // update main document
    if ( note._id === undefined )  {    // create new record
      try {
        res = await this._couchDB?.newDocument(jsonNote);
        origNote._id = res.id;
        origNote._rev = res.rev;
        isNew = true;
      } catch ( error) {
        this.handleError(error as CouchError);
      }
    } else {                            // update existing record
      if ( !onlyAttachment ) {
        try {
          res = await this._couchDB?.updateDocument(jsonNote);
          origNote._rev = res?.rev;
        } catch ( error) {
          this.handleError(error as CouchError);
        }
      }
      isNew = false;
    }

  
    let revertToNote = false;
    for(const attachEntry of [...note._attachments.entries()]) {
      if ( attachEntry[1].length == - 1 ) {
        try {
          const deleteFile = await this._couchDB?.deleteAttachment({documentId: origNote._id!, rev: origNote._rev!, fileName: attachEntry[0]});
          if ( !deleteFile || deleteFile.ok !== true ) {
            revertToNote = true;
            break;
          }

          origNote._rev = deleteFile.rev;
        } catch ( error) {
          this.handleError(error as CouchError);
        }
      } else if ( attachEntry[1].digest === "" ) {
        try {
          const uploadFile = await this._couchDB?.uploadAttachment({documentId: origNote._id!, rev: origNote._rev!, file: attachEntry[1].data});
          if ( !uploadFile || uploadFile.ok !== true ) {
            revertToNote = true;
            break;
          }
          origNote._rev = uploadFile.rev;
        } catch( error ) {
          this.handleError(error as CouchError);
        }
      }
    };

    if ( revertToNote ) {
      console.log("muse revert to previous revision");
      return;
    }
    
    let n;
    try {
      n = objectToNote(await this._couchDB?.getDocument(origNote._id!, origNote._rev));
    } catch( error: any ) {
      this.handleError(error);
      //this.showToaster(html`An error happened. Click <a @click=${this.fetchNotes}>here</a> to refresh`);
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

  @state()
  _toasterMessage = html``;

  private showToaster(content: any) {
    this._toasterMessage = content;
    this.toaster.show = true;
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


  private async selectDatabase(selectId: string) {
    const db = (this.shadowRoot?.querySelector(`select#${selectId}`) as HTMLSelectElement).value;
    await this._couchDB?.useDatabase(db);
    await this.fetchNotes();
    this.requestUpdate();
  }

  private _updateEncryptionKey(e: InputEvent) {
    this.encryptionKey = (e.target as HTMLInputElement).value;
  }


  private _sortOn(e: Event) {
    const target = e.target as QuickNoteTag;
    if ( target.value === "" ) target.value = "⬇";
    else if ( target.value === "⬇" ) target.value = "⬆";
    else if ( target.value === "⬆" ) target.value = "";
    this.shadowRoot?.querySelectorAll("div.sort quick-note-tag").forEach( (t) => {
      if ( t != target ) (t as QuickNoteTag).value = "";
    });
    (this.shadowRoot?.querySelector("quick-note-search-bar") as QuickNoteSearchBar).doSearch();


  }

  render() {

    const dbs = this._couchDB?.getAccessibleDatabases().then( (dbs) => dbs.map( (db: string) => html`
      <option value="${db}" ?selected=${this._couchDB?.currentDatabase === db}>${db}</option>
    `) ) ;
    
    return html`

      <simple-toaster position="top-right">
        <div class="toasted">
          ${this._toasterMessage}
        </div>
      </simple-toaster>
      <header>
        <div class="logo">${QuickNoteIcon}
        </div>
        <h1 >${this.title}</h1>
        <input ?hidden=${!this.loggedIn} type="password" id="encryptionKey" placeholder="${msg('encryption key')}" @change=${this._updateEncryptionKey} class="spaceMe"/>
        <div ?hidden=${!this.loggedIn} class="spaceMe selectDatabase">
          <select @change=${() => this.selectDatabase("selectDatabaseInMenuBar")} id="selectDatabaseInMenuBar" style="width: 100%">
          ${ until(dbs) }
          </select>
        </div>
        <button class="spaceMe createNewNote" ?hidden=${!this.loggedIn} @click=${this.createNote}>+</button>
        <button class="spaceMe logout" ?hidden=${!this.loggedIn} @click=${this.logout}>${LogoutIcon}</button>
      </header>
      <main>
        <!-- LOGIN DIALOG -->
        <div class="login boxShadow" ?hidden=${this.loggedIn}>
          <h2><i>${msg('Welcome in Quick Notes')}</i></h2>
          <form @submit=${this.login} >
            <input type="text" placeholder="${msg('Username')}" name="username" id="username"/>
            <input type="password" placeholder="${msg('Password')}" name="password" id="password"/>
            <input type="submit" value="${msg("Login")}"/>
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
            .encryptionKey=${this.encryptionKey}
        ></quick-note-detail>
        <!-- END OF DETAIL OF A NOTE -->

        <!-- LIST OF NOTES -->
        <div ?hidden=${this.selected !== undefined || !this.loggedIn} id="list">
          <quick-note-search-bar @search="${(e: CustomEvent) => this.fetchNotes(e.detail)}"></quick-note-search-bar>
          <div class="sort">
            <div ?hidden=${!this.fetchingNotes} class="fetchingIndicator">${msg('Fetching notes')}</div>
            <span>${msg('Sort:')} </span>
            <quick-note-tag id="sortOnCreatedAt" @click="${this._sortOn}" key="${msg('Created At')}" value=""></quick-note-tag>
            <quick-note-tag id="sortOnCreatedAt" @click="${this._sortOn}" key="${msg('Title')}" value=""></quick-note-tag>
            <quick-note-tag id="sortOnCreatedAt" @click="${this._sortOn}" key="${msg('Author')}" value=""></quick-note-tag>
            <quick-note-tag id="sortOnCreatedAt" @click="${this._sortOn}" key="${msg('Encrypted')}" value=""></quick-note-tag>
          </div>
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
          <!-- END OF LIST OF NOTES -->


        </div>
      </main>

      <!-- SELECT DB DIALOG -->
      <quick-note-dialog id="selectDB" ?open="${this.loggedIn && this._couchDB?.currentDatabase === ""}">
        <h2 slot="heading">${msg('Select a database')}</h2>
        <select id="selectDatabase" style="width: 100%">
        ${ when( this._couchDB?.currentDatabase === "", () => until(dbs)) }
        </select>
        <div style="display: flex; justify-content: flex-end; padding: 3px;">
          <button @click=${() => this.selectDatabase("selectDatabase")}>${msg('Select')}</button>
        </div>
        
      </quick-note-dialog>
      <!-- SELECT DB DIALOG -->

      <quick-note-dialog backdrop id="confirmDeleteDialog">
        <h2 slot="heading">${msg('Confirm deletion')}</h2>
        <p>${msg('Do you really want to delete note <i><u>${this.selected?.title}</u></i> ?')}</p>
        <div style="display: flex; justify-content: flex-end; padding: 3px;">
          <button style="margin-right: 2px;" @click=${() => { this.confirmDeleteDialog?.close(); this._deleteNote()}}>${msg('Yes')}</button>
          <button style="margin-left: 2px;" @click=${() => this.confirmDeleteDialog?.close()}>${msg('No')}</button>
        </div>
      </quick-note-dialog>
      <footer>
        Copyleft
      </footer>
    `;
  }
}


customElements.define('quick-note-app', QuickNoteApp);