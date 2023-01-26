import { LitElement, html, css } from 'lit';
import { query, queryAssignedElements } from 'lit/decorators.js';
import { QuickNoteTag } from './QuickNoteTag';


export class QuickNoteSearchBar extends LitElement {

  static styles = css`
    :host {
      --size: 48px;
      padding: 5px;
      min-height: var(--size);
    }

    .main-container {
      background: white;
      border-radius: calc(var(--size) / 2);
      border: 1px solid lightgray;
      height: 100%;
      box-sizing: border-box;
      display: flex;
    }

    .main-container input {
      height: 100%;
      border: 0px;
      box-sizing: border-box;
      flex: 1;
    }

    .main-container input[padded] {
      margin-left: calc(var(--size) / 2);
    }

    .search {
      border-radius: 0px calc(var(--size)/2) calc(var(--size)/2) 0px;
      border: 1px solid lightgray;
    }

    input[type="text"] {
      outline: none;
      background: transparent;
    }

    :host(:focus-within) .main-container {
      outline: 2px solid lightblue;
    }

    .tag-container {
      display: flex;
      align-items: center;
      margin-left: 5px;
      gap: 3px;
    }

    .search {
      border: 0px;
      border-left: 1px solid lightgray;
    }

    .clear {
      border: 0px;
      border-left: 1px solid lightgray;
    }
  `;

  
  //private tags: Array<Label> = [];

  private buildQuery(e: InputEvent) {
    if ( e.data === ' ' || e.type === 'change' ) {
      if ( this.textInputField.value.indexOf(":") != -1 ) {
        const searchText = this.textInputField.value;
        const indSep = searchText.indexOf(":");

        if ( searchText.substring(indSep + 1).trim().length == 0 ) {

        } else {
          let textInd = indSep - 1;
          while(searchText.charAt(textInd) == ' ') textInd--;
          textInd = searchText.substring(0, textInd).lastIndexOf(" ");
          const t = {key: searchText.substring(textInd, indSep).trim(), value: searchText.substring(indSep + 1).trim()};
          // this.tags.push(t);
          this.textInputField.value = searchText.substring(0, textInd);
          const tag = document.createElement("quick-note-tag") as QuickNoteTag;
          tag.key = t.key;
          tag.value = t.value;
          tag.deletable = true;
          tag.slot = "tags";
          tag.addEventListener("delete", () => {
            tag.remove();

          });

          this.appendChild(tag);
          //this.requestUpdate();

          /*
           ${this.tags.map( (tag, index) => html`
            <quick-note-tag key=${tag.key} value=${tag.value} deletable @delete="${ () => this.tags.splice(index, 1) && this.requestUpdate()}"></quick-note-tag>
          `)}
           */
        }
      }
    }
  }

  private buildJsonQuery() {
    const term = this.textInputField.value.trim();

    const keysOfNotes: Array<string> = [];

    const res: any = { selector: { }};
    
    const tags = this.tags.filter( (tag) => ["title", "author", "content", "createat"].indexOf(tag.key) == -1)
    const searchForTitle = this.tags.filter( (tag) => tag.key.toLowerCase() === 'title').map( (tag) => tag.value);
    const searchForAuthors = this.tags.filter( (tag) => tag.key.toLowerCase() === 'author').map( (tag) => tag.value);
    const searchForContent = this.tags.filter( (tag) => tag.key.toLowerCase() === 'content').map( (tag) => tag.value);
    const searchForCreatedAt = this.tags.filter( (tag) => tag.key.toLowerCase() === 'createdat').map( (tag) => tag.value);

    let title = {};
    if ( searchForTitle.length > 1 ) {
      title = { $or: searchForTitle.map( (title) => ({ "title": { "$regex": `(?i).*${title}.*`}}))};
    } else if ( searchForTitle.length == 1 ) {
      title = {"title" : { "$regex": `(?i).*${searchForTitle[0]}.*`}};
    }  else {
      keysOfNotes.push("title");
    }
    
    let author = {};
    if ( searchForAuthors.length > 1 ) {
      author = { $or: searchForAuthors.map( (author) => ({ "author": { "$regex": `(?i).*${author}.*`}}))};
    } else if ( searchForAuthors.length == 1 ) {
      author = { "author": { "$regex": `(?i).*${searchForAuthors[0]}.*`}};
    }  else {
      keysOfNotes.push("author");
    }

    let content = {};
    if ( searchForContent.length > 1 ) {
      content = { $or: searchForContent.map( (content) => ({ "content": { "$regex": `(?i).*${content}.*`}}))};
    } else if ( searchForContent.length == 1 ) {
      content = { "content": { "$regex": `(?i).*${searchForContent[0]}.*`}};
    }  else {
      keysOfNotes.push("content");
    }
    

    let terms : any = { $or: []};
    if ( term.length > 0 ) {
      keysOfNotes.forEach( key => {
        terms.$or.push({[key]: {"$regex": `(?i).*${term}.*`}});
      });
    }

    res.selector.$and = [];
    if ( Object.keys(content).length > 0 ) res.selector.$and.push(content);
    if ( Object.keys(author).length > 0  ) res.selector.$and.push(author);
    if ( Object.keys(title).length > 0  ) res.selector.$and.push(title);
    if ( Object.keys(terms).length > 0  ) res.selector.$and.push(terms);
    

    if ( tags.length > 0 ) {
      const elemMatch = tags.reduce( (acc, currval) => { 
        acc["value"] = { "$regex" : "(?i).*" + currval.value + ".*"}; 
        acc["key"] = { "$regex" : "(?i).*" + currval.key + ".*"}; 
        return acc;
      }, {} as any);
      res.selector.$and.push({"labels": { "$elemMatch": elemMatch}});
      //res.selector.labels = { "$elemMatch": elemMatch};
    }
    
    console.log(JSON.stringify(res));
    //( (key) => {[key.toString()]: {}}));
    return res;

    return {
      genericTerm: term,
      tags: this.tags.map( (tag) => {return { key: tag.key, value: tag.value}})
    };
  }

  @query('input[type="text"')
  private textInputField!: HTMLInputElement;
  
  @query('button.search')
  private searchButton!: HTMLButtonElement;
  
  @queryAssignedElements({slot:'tags', selector: 'quick-note-tag'})
  private tags!: Array<QuickNoteTag>;


  private clearSearch() {
    this.innerHTML = "";
    this.textInputField.value = "";
    this.dispatchEvent(new CustomEvent("search", {detail: this.buildJsonQuery()}))
  }

  render() {
    const hasTags = this.tags.length != 0;
    return html`
      <div class="main-container">
        <div class="tag-container">
          <slot name="tags">
          </slot>
        </div>
        <input type="text" @input=${this.buildQuery} @change=${this.buildQuery} @keyup="${ (e: KeyboardEvent) => { if (e.key === 'Enter'){ this.dispatchEvent(new CustomEvent("search", {detail: this.buildJsonQuery()}))}}}" ?padded=${hasTags} placeholder="search"/>
        <button class="clear" @click=${this.clearSearch}>Clear</button>
        <button class="search" @click=${ () => this.dispatchEvent(new CustomEvent("search", {detail: this.buildJsonQuery()}))}>Search</button>
      <div>
    `;
  }
}

customElements.define('quick-note-search-bar', QuickNoteSearchBar);