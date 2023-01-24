import { notEqual } from "lit";
import { __values } from "tslib";
import { Attachment, Label, Note } from "./NoteDefinition";

export const dateRenderingOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute:'numeric' };

export function getCookie(name: string): string|undefined {
    function escape(s: string) { return s.replace(/([.*+?\^$(){}|\[\]\/\\])/g, '\\$1'); }
    var match = document.cookie.match(RegExp('(?:^|;\\s*)' + escape(name) + '=([^;]*)'));
    return match ? match[1] : undefined;
}

export function hexEncode(s: string): string {
    
    let hex = ''
    for (var i = 0, l = s.length; i < l; i++) {
        hex += s.charCodeAt(i).toString(16);
    }
    return hex;
}

export function objectsToNotes(o: Array<any>): Note[] {
    return o.map( (n) => objectToNote(n)).filter( (n) => n !== undefined) as Note[];
}

export function noteToJSON(note: Note) {
    return {
        _id: note._id,
        _rev: note._rev,
        title: note.title,
        author: note.author,
        content: note.content,
        createdAt: note.createdAt.getTime(),
        _attachments: note._attachments,
        labels: note.labels
    };
}

export function objectToNote(o: any): Note|undefined {

    /*id?: string;
    revision?: string;

    title: string;
    author: string;
    createdAt: Date;
    content: any;

    labels: Array<Label>;
    attachments: Map<string, Attachment>; */

    if ( !isAValidNote(o)) return undefined;

    const attachments = o._attachments || new Map<string, Attachment>();
    const labels = o.labels || [];
    
    return {
        _id: o._id,
        _rev: o._rev,
        title: o.title,
        author: o.author,
        content: o.content,
        createdAt: new Date(o.createdAt),
        _attachments: new Map<string, Attachment>(Object.entries(attachments)),
        labels: [...labels]
    };
}

export function isAValidLabel(o: any): boolean {
    return o.hasOwnProperty("key") && typeof(o.key) === 'string' && 
            o.hasOwnProperty("value") && typeof(o.value) === 'string';
}

export function isAValidAttachment(o: any): boolean {
    /*contentType: String;
    revPos: number;
    digest: string;
    length: number;*/
    return o.hasOwnProperty("content_type") && typeof(o.content_type) === 'string' &&
            o.hasOwnProperty("revpos") && typeof(o.revpos) === 'number' && 
            o.hasOwnProperty("digest") && typeof(o.digest) === 'string' &&
            o.hasOwnProperty("length") && typeof(o.length) === 'number';
}

export function isAValidNote(o : any): boolean {
    const members = [...Object.keys(o)];
    return o.hasOwnProperty("_id") && typeof(o._id) === 'string' &&
            o.hasOwnProperty("_rev") && typeof(o._rev) === 'string' &&
            o.hasOwnProperty("title") && typeof(o.title) === 'string' &&
            o.hasOwnProperty("author") && typeof(o.author) === 'string' &&
            o.hasOwnProperty("content") && typeof(o.content) === 'string' &&
            o.hasOwnProperty("createdAt") && typeof(o.createdAt) === 'number' &&
            o.hasOwnProperty("labels") && (o.labels instanceof Array) && (o.labels as Array<Label>).every( isAValidLabel ) &&
            ((o._attachments === undefined ) || (o._attachments instanceof Map || o._attachments instanceof Object) && [...Object.values(o._attachments as Map<string, Attachment>)].every( isAValidAttachment ))

}

export function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}


export function getIconFromMIME(mimeType: string) {
    // List of official MIME Types: http://www.iana.org/assignments/media-types/media-types.xhtml
    const icon_classes: any = {
      // Media
      image: "fa-file-image-o",
      audio: "fa-file-audio-o",
      video: "fa-file-video-o",
      // Documents
      "application/pdf": "fa-file-pdf-o",
      "application/msword": "fa-file-word-o",
      "application/vnd.ms-word": "fa-file-word-o",
      "application/vnd.oasis.opendocument.text": "fa-file-word-o",
      "application/vnd.openxmlformats-officedocument.wordprocessingml":
        "fa-file-word-o",
      "application/vnd.ms-excel": "fa-file-excel-o",
      "application/vnd.openxmlformats-officedocument.spreadsheetml":
        "fa-file-excel-o",
      "application/vnd.oasis.opendocument.spreadsheet": "fa-file-excel-o",
      "application/vnd.ms-powerpoint": "fa-file-powerpoint-o",
      "application/vnd.openxmlformats-officedocument.presentationml":
        "fa-file-powerpoint-o",
      "application/vnd.oasis.opendocument.presentation": "fa-file-powerpoint-o",
      "text/plain": "fa-file-text-o",
      "text/html": "fa-file-code-o",
      "application/json": "fa-file-code-o",
      // Archives
      "application/gzip": "fa-file-archive-o",
      "application/zip": "fa-file-archive-o"
    };
  
    for (var key in icon_classes) {
      if (icon_classes.hasOwnProperty(key)) {
        if (mimeType.search(key) === 0) {
          // Found it
          return icon_classes[key];
        }
      } else {
        return "fa-file-o";
      }
    }
  }
  