export interface Attachment {
    content_type: string;
    revPos: number;
    digest: string;
    length: number;

    data?: any; // will be null, but requested to update / create a document
}
  
export interface Label {
    key: string;
    value: string;
}

export interface Note extends Object {
    _id?: string;
    _rev?: string;

    title: string;
    author: string;
    createdAt: Date;
    content: any;

    labels: Array<Label>;
    _attachments: Map<string, Attachment>;
}