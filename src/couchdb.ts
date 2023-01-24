import { stringFixture } from "@open-wc/testing-helpers";

const keyUsername = "fryeiskghfbreidjs";
const keyAuthSession = "feronfskdlvguidbythiuer";

export class CouchError extends Error {

    public readonly error;

    constructor(params: any, error: any) {
        super(params);
        this.error = error;
    }
}

export const DBNotSelected = new CouchError("No database selected.", undefined);
export const NotConnected = new CouchError("Not connected.", undefined);


export interface FindRequest {
    selector: any;                    
    limit?: number;                 // Maximum number of results returned. Default is 25. Optional
    skip?: number;                  // Skip the first ‘n’ results, where ‘n’ is the value specified. Optional
    sort?: any;                     // JSON array following sort syntax. Optional
    fields?: Array<any>;            // JSON array specifying which fields of each object should be returned. If it is omitted, the entire object is returned. More information provided in the section on filtering fields. Optional
    use_index?: string| Array<any>; // Instruct a query to use a specific index. Specified either as "<design_document>" or ["<design_document>", "<index_name>"]. Optional
    conflicts?: boolean;            // Include conflicted documents if true. Intended use is to easily find conflicted documents, without an index or view. Default is false. Optional
    r?: number;                     // Read quorum needed for the result. This defaults to 1, in which case the document found in the index is returned. If set to a higher value, each document is read from at least that many replicas before it is returned in the results. This is likely to take more time than using only the document stored locally with the index. Optional, default: 1
    bookmark?: string;              // A string that enables you to specify which page of results you require. Used for paging through result sets. Every query returns an opaque string under the bookmark key that can then be passed back in a query to get the next page of results. If any part of the selector query changes between requests, the results are undefined. Optional, default: null
    update?: boolean;               // Whether to update the index prior to returning the result. Default is true. Optional
    stable?: boolean;               // Whether or not the view results should be returned from a “stable” set of shards. Optional
    stale?: string;                 // Combination of update=false and stable=true options. Possible options: "ok", false (default). Optional Note that this parameter is deprecated. Use stable and update instead. See Views Generation for more details.
    execution_stats?: boolean;      // Include execution statistics in the query response. Optional, default: false
}

export class CouchDB {
    

    private _username: string;
    private server: string;
    private _password: string;
    //private authSession: Map<string, any>;
    private _userRoles: Array<string>;
    private _database: string;

    private constructor(args: {username:string, password: string, server: string}) {
        this._username = args.username;
        this._password = args.password;
        this.server =  args.server;
        //this.authSession =  new Map<string, any>();
        this._userRoles = [];
        this._database = "";
    }


    public static async connect(params: {server: string, username: string, password: string}|string): Promise<CouchDB|undefined> {
        let couchdb;
        if ( typeof(params) === 'string' ) {
            const res = await fetch(`${params}/_session`, {
                headers: {
                    "Content-Type": "application/json"
                },
                method: 'GET',
            });
            if ( !res || res.status != 200 ) throw new CouchError(`Error during connect to ${params}`, res);//return [res.status, await res.json()];
            const jsonRes = await res.json();
            const username = jsonRes.userCtx.name;
            if ( username === undefined || username === null ) return undefined;
            couchdb = new CouchDB({server: params, username: username, password: ''});
            couchdb._userRoles = [...(jsonRes.userCtx.roles as Array<string>)];
            return couchdb;
        } else {
            couchdb = new CouchDB({server: params.server, username: params.username, password: params.password });
            await couchdb.reconnect();
            return couchdb;
        }
    }
    
    get username() {
        return this._username;
    }

    get userRoles() {
        return this._userRoles;
    }

    async setPassword(pwd: string): Promise<void> {
        const backupPassword = this._password;
        this._password = pwd;
        try {
            this.reconnect();
        } catch( err ) {
            this._password = backupPassword;
            throw err;
        }
    }

    async isConnected(): Promise<boolean> {
        const res = await fetch(`${this.server}/_session`);
        return res && res.status == 200 && (await res.json()).ok === true;
    }

    async getDatabases(): Promise<Array<string>> {
        if ( !this.isConnected()) throw NotConnected;

        const res = await fetch(`${this.server}/_all_dbs`, {
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        });
        if ( !res || res.status != 200 ) throw new CouchError("Error during fetching databases", res);
        return await res.json() as Array<string>;
    }

    public get currentDatabase() {
        return this._database;
    }

    async newDatabase(name: string): Promise<boolean> {
        if ( !this.isConnected()) throw NotConnected;

        const res = await fetch(`${this.server}/${name}`, {
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            method: 'PUT'
        });
        if ( !res || (res.status != 201 && res.status != 202 )) throw new CouchError(`Error during new database ${name}`, res);

        return (await res.json() as any ).ok === 'true';
    }

    async deleteDatabase(name: string): Promise<boolean> {
        if ( !this.isConnected()) throw NotConnected;
        
        const res = await fetch(`${this.server}/${name}`, {
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            method: 'DELETE'
        })
        if ( !res || (res.status != 200 && res.status != 202) ) throw new CouchError(`Error during delete database ${name}`, res);
        return (await res.json() as any ).ok === 'true';
    }

    async useDatabase(db: string): Promise<void> {
        if ( !this.isConnected()) throw NotConnected;
        if ( db === '' ) return;

        const res = await fetch(`${this.server}/${db}`, {
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
        })
        if ( !res || res.status != 200 ) throw new CouchError(`Error during use database ${db}`, res);

        this._database = db;
        
    }

    async getAllDocuments(): Promise<Array<any>> {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "") throw DBNotSelected;

        const res = await fetch(`${this.server}/${this._database}/_all_docs?include_docs=true`, {
            credentials: 'include',
            headers: {
                "Content-Type": "application/json"
            },
        });
        if ( !res || res.status != 200 ) throw new CouchError("Error during get all documents", res);

        return (await res.json()).rows.map( (d: any) => d.doc);
    }

    async getDocuments(request:FindRequest): Promise<any> {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "") throw DBNotSelected;
        
        const res = await fetch(`${this.server}/${this._database}/_find`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify(request)
        });
        if ( !res || res.status != 200 ) throw new CouchError("Error during get documents", res);

        return await res.json();
    }

    async getDocument(docId: string, rev?: string, attachments=false): Promise<any> {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "") throw DBNotSelected;

        //const url = new URL(`${this.server}/${this._database}/${docId}`);
        const searchParams = new URLSearchParams();
        if ( rev ) {
            searchParams.append("rev", rev);
        }
        if ( attachments !== undefined ) {
            searchParams.append("attachments", "" + attachments);
        }

        const res = await fetch(`${this.server}/${this._database}/${docId}?${searchParams.toString()}`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
        });
        if ( !res || (res.status != 200 && res.status != 304)) throw new CouchError(`Error during get document id: ${docId} / rev: ${rev} / with_attachments:${attachments}`, res);

        return await res.json();
    }

    async updateDocument(doc: any): Promise<any> {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "") throw DBNotSelected;

        return await(await fetch(`${this.server}/${this._database}/${doc._id}?_rev=${doc._rev}`, {
            method: 'PUT',
            headers: {
                //"Referer": window.location.host,
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify(doc)
        })).json();
    }

    async deleteDocument(doc: any): Promise<any> {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "") throw DBNotSelected;

        return await ( await fetch(`${this.server}/${this._database}/${doc._id}?rev=${doc._rev}`, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        })).json();
    }

    async newDocument(doc: any): Promise<boolean|any> {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "") throw DBNotSelected;

        if ( doc._id === undefined ) {
            doc._id = await this.getUUIDs();
        }
        const res = await(await fetch(`${this.server}/${this._database}/${doc._id}`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include',
            body: JSON.stringify(doc)
        })).json();
        doc._rev = res.rev;
        return res;
    }

    async getUUIDs(count = 1): Promise<number|Array<number>> {
        if ( !this.isConnected()) throw NotConnected;

        const res =  await (await fetch(`${this.server}/_uuids?count=${count}`,{
            headers: {
                "Content-Type": "application/json"
            },
            credentials: 'include'
        })).json() as any;
        if ( count == 1 ) return res.uuids[0];
        return res.uuids;
    }

    async reconnect(): Promise<void> {
        if ( this._password === "" ) throw Error("Unable to reconnect as we don't know the password");
        
        const res = await fetch( `${this.server}/_session`, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({username: this.username, password: this._password})
        });

        if ( !res || res.status != 200 ) throw new CouchError(`Error during connection to ${this.server}`, res);
        const jsonRes = await res.json();
        this._userRoles = [...(jsonRes.roles as Array<string>)];

        localStorage.setItem(keyUsername, atob(this.username));
        if ( this._database !== "" && this._database !== undefined && this._database !== null ) {
            await this.useDatabase(this._database);
        }
    }

    async disconnect(): Promise<void> {
        await fetch(`${this.server}/_session`, {
            method: 'DELETE',
            credentials: 'include'
        });
        localStorage.removeItem(keyUsername);
    }

    async deleteAttachment(params: {documentId: string, rev: string, fileName: string}) {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "" ) throw DBNotSelected;
        
        const res = await fetch(`${this.server}/${this._database}/${params.documentId}/${params.fileName}?rev=${params.rev}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        if ( !res || (res.status != 200 && res.status != 202)) throw new CouchError(`Error during delete attachment doc id: ${params.documentId} / rev: ${params.rev} / filename: ${params.fileName}`, res);
        return await res.json();
    }

    async uploadAttachment(params: {documentId: string, rev: string, file: File }): Promise<any> {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "" ) throw DBNotSelected;
        
        //const fData = new FormData();
        const fileName = params.file.name;
        //fData.append("file", params.file);
        const res = await fetch(`${this.server}/${this._database}/${params.documentId}/${fileName}?rev=${params.rev}`, {
            method: 'PUT',
            credentials: 'include',
             headers: {
                 "Content-Type": params.file.type
             },
            body: params.file//fData
        });
        if ( !res || (res.status != 201 && res.status != 202)) throw new CouchError(`Error during uploading attachment doc id: ${params.documentId} / rev: ${params.rev} / filename: ${fileName}`, res);
        return await res.json();
    }

    async downloadAttachment(params: {documentId: string, rev?: string, attachment: string}) {
        if ( !this.isConnected()) throw NotConnected;
        if ( this._database === "" ) throw DBNotSelected;

        const res = await fetch(`${this.server}/${this._database}/${params.documentId}/${params.attachment}?_rev=${params.rev}`, {
            method: 'GET',
            credentials: 'include'
        });
        if ( !res || res.status != 200 ) throw new CouchError(`Error during uploading attachment doc id: ${params.documentId} / rev: ${params.rev} / filename: ${params.attachment}`, res);
        return res;
    }

    async getRevisions(docId: string): Promise<Array<string>> {
        const res =await (await fetch(`${this.server}/${this._database}/${docId}?revs=true`)).json();
        return res._revisions.ids.map( (revId: string, index: number) => (res._revisions.start - index) + revId);
    } 

}