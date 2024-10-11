import {app} from "electron";
import * as fs from "node:fs";
import path from "path";

const root: string = app.getPath('userData');

export class Store {
    private readonly filePath: string;
    private readonly def: any;
    private store: any;

    constructor(storeName: string, defValue?: any) {
        this.filePath = path.join(root, storeName);
        this.def = defValue;

        if (!fs.existsSync(this.filePath)) {
            try {
                this.store = defValue;
                this.save();
            } catch (e) {
                return e;
            }
        } else {
            try {
                this.load();
            } catch (e) {
                return e;
            }
        }
    }

    get() {
        return this.store;
    }

    set(store: any) {
        this.store = store;
    }

    load() {
        try {
            this.store = JSON.parse(fs.readFileSync(this.filePath, 'utf-8'));
            this.fillMissingValues();
        } catch (e) {
            return e;
        }
    }

    save() {
        if (!this.store) return;

        try {
            fs.writeFileSync(this.filePath, JSON.stringify(this.store));
        } catch (e) {
            return e;
        }
    }

    async saveAsync() {
        if (!this.store) return;

        try {
            await fs.promises.writeFile(this.filePath, JSON.stringify(this.store))
        } catch (e) {
            return e;
        }
    }

    fillMissingValues() {
        let save = false;

        for (const key in this.def) {
            if (!Object.prototype.hasOwnProperty.call(this.store, key)) {
                this.store[key] = this.def[key];
                save = true;
            }
        }

        if (save) this.save();
    }
}