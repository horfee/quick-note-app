import { localized, msg } from '@lit/localize';
import { LitElement, html, css } from 'lit';
import { query, queryAssignedElements } from 'lit/decorators.js';
import { QuickNoteTag } from './QuickNoteTag';
import { stringToDateUsingLocale } from './utils';

@localized()
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
    
    const tags = this.tags.filter( (tag) => ["title", "author", "content", "createdat"].indexOf(tag.key) == -1)
    const searchForTitle = this.tags.filter( (tag) => tag.key.toLowerCase() === 'title').map( (tag) => tag.value);
    const searchForAuthors = this.tags.filter( (tag) => tag.key.toLowerCase() === 'author').map( (tag) => tag.value);
    const searchForContent = this.tags.filter( (tag) => tag.key.toLowerCase() === 'content').map( (tag) => tag.value);
    let searchForCreatedAt: Array<any> = this.tags.filter( (tag) => tag.key.toLowerCase() === 'createdat').map( (tag) => tag.value);

    searchForCreatedAt = searchForCreatedAt.map( (t: string) => {
      if ( t.charAt(0) === '>' || t.charAt(0) === '<' || t.charAt(0) === '=') {
        let index = 0;
        while ( "0123456789".indexOf(t.charAt(index)) == -1  && index < t.length) index++;
        if ( index < t.length ) {
          const op = t.substring(0, index);
          t = t.substring(index);
          const d = stringToDateUsingLocale(t);
          switch (op) {
            case ">":
              return {
                "createdAt": {
                  "$gt": d.getTime()
                }
              }           
            case ">=":
              return {
                "createdAt": {
                  "$gte": d.getTime()
                }
              }           
            case "<":
              return {
                "createdAt": {
                  "$lt": d.getTime()
                }
              }           
            case "<=":
              return {
                "createdAt": {
                  "$lte": d.getTime()
                }
              }              
          }
        }
      }
      const d = new Date(stringToDateUsingLocale(t));
      d.setHours(0);
      d.setMinutes(0);
      d.setSeconds(0);
      const d2 = new Date(stringToDateUsingLocale(t));
      d2.setHours(23);
      d2.setMinutes(59);
      d2.setSeconds(59);
      return {
        "$and": [
          {
            "createdAt": {
              "$gte": d.getTime()
            }
          },
          {
            "createdAt": {
              "$lte": d2.getTime()
            }
          }
        ]
        
      }
    });

    let title = {};
    if ( searchForTitle.length > 1 ) {
      title = { $or: searchForTitle.map( (title) => ({ "title": { "$regex": `(?i).*${title}.*`}}))};
    } else if ( searchForTitle.length == 1 ) {
      title = {"title" : { "$regex": `(?i).*${searchForTitle[0]}.*`}};
    }  else {
      keysOfNotes.push("title");
    }

    let createdAt = {};
    if ( searchForCreatedAt.length > 1 ) {
      createdAt = { $or: searchForCreatedAt};
    } else if ( searchForCreatedAt.length == 1 ) {
      createdAt = searchForCreatedAt[0];
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
    if ( Object.keys(createdAt).length > 0  ) res.selector.$and.push(createdAt);
    

    if ( tags.length > 0 ) {
      const elemMatch = tags.reduce( (acc, currval) => { 
        acc["value"] = { "$regex" : "(?i).*" + currval.value + ".*"}; 
        acc["key"] = { "$regex" : "(?i).*" + currval.key + ".*"}; 
        return acc;
      }, {} as any);
      res.selector.$and.push({"labels": { "$elemMatch": elemMatch}});
      //res.selector.labels = { "$elemMatch": elemMatch};
    }
    
    return res;
  }

  @query('input[type="text"')
  private textInputField!: HTMLInputElement;
  
  @query('button.search')
  private searchButton!: HTMLButtonElement;
  
  @queryAssignedElements({slot:'tags', selector: 'quick-note-tag'})
  private tags!: Array<QuickNoteTag>;


  public clearSearch() {
    this.innerHTML = "";
    this.textInputField.value = "";
    this.dispatchEvent(new CustomEvent("search", {detail: this.buildJsonQuery()}))
  }

  public doSearch() {
    (this.shadowRoot?.querySelector("button.search") as HTMLButtonElement).click();
  }

  

  render() {
    const hasTags = this.tags.length != 0;
    return html`
      <div class="main-container">
        <div class="tag-container">
          <slot name="tags">
          </slot>
        </div>
        <input type="text" @input=${this.buildQuery} @change=${this.buildQuery} @keyup="${ (e: KeyboardEvent) => { if (e.key === 'Enter'){ this.dispatchEvent(new CustomEvent("search", {detail: this.buildJsonQuery()}))}}}" ?padded=${hasTags} placeholder="${msg('search')}"/>
        <button class="clear" @click=${this.clearSearch}>${msg('Clear')}</button>
        <button class="search" @click=${ () => this.dispatchEvent(new CustomEvent("search", {detail: this.buildJsonQuery()}))}>${msg('Search')}</button>
      <div>
    `;
  }
}

customElements.define('quick-note-search-bar', QuickNoteSearchBar);
