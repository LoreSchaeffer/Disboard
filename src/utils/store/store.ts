import {app} from "electron";
import * as fs from "node:fs";
import path from "path";

const root: string = app.getPath('userData');

export class Store {
    private readonly filePath: string;
    private readonly def: any;
    private readonly onReload: (store: Store) => void;
    private store: any;
    private watch: fs.FSWatcher;

    constructor(storeName: string, defValue?: any, onReload?: (store: Store) => void) {
        this.filePath = path.join(root, storeName);
        this.def = defValue;
        this.onReload = onReload;

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

        this.startWatching();
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
            this.stopWatching()
            fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2));
            this.startWatching();
        } catch (e) {
            this.startWatching();
            return e;
        }
    }

    async saveAsync() {
        if (!this.store) return;

        try {
            await fs.promises.writeFile(this.filePath, JSON.stringify(this.store, null, 2));
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

    private startWatching() {
        this.watch = fs.watch(this.filePath, (event) => {
            if (event === 'change') {
                console.log(`File ${this.filePath} changed. Reloading...`);
                this.load();
                if (this.onReload) this.onReload(this.store)
            }
        })
    }

    private stopWatching() {
        if (this.watch) {
            this.watch.close();
            this.watch = null;
        }
    }
}