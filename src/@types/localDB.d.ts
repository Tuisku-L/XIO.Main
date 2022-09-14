declare namespace LocalDBEntity {
    interface Doc<T> {
        _id: string;
        data: T;
        _rev?: string;
        _attachments?: any;
    }
}
