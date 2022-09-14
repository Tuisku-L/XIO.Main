import { Low, JSONFile } from "@commonify/lowdb";
import { v4 as uuid } from "uuid";

export default class LocalDB {
    private _localDB: Low<any> | null = null;

    get localDB() {
        return this._localDB;
    }

    constructor(dbPath: string) {
        const adapter = new JSONFile(dbPath);
        this._localDB = new Low(adapter);
    }

    public async initDB(belong: string) {
        if (this._localDB) {
            await this._localDB.read();
            if (!this._localDB.data["belong"]) {
                this._localDB.data["belong"] = belong;
                await this._localDB.write();
            }
        }
    }

    private parseData = (data: any) => {
        data._id = uuid();
        data._version = Date.now();

        return data;
    }

    async insert(name: string, data: any) {
        if (this._localDB) {
            const parseData = this.parseData(data);
            this._localDB.data[name] = parseData;
            await this._localDB.write();

            return parseData;
        }

        return data;
    }

    get<T>(name: string): T | null {
        if (this._localDB) {
            return this._localDB.data[name];
        }

        return null;
    }
}
