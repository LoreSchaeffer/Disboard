import * as fs from "node:fs";
import path from "path";
import {root} from "../main";

export type StoreOptions<T> = {
    defValue?: T;
    onChange?: (store: T, fromFileChange: boolean) => void;
}

export class Store<T> {
    private readonly filePath: string;
    private readonly options?: StoreOptions<T>;
    private store: T;
    private watch: fs.FSWatcher;

    constructor(storeName: string, options: StoreOptions<T>) {
        this.filePath = path.join(root, storeName + '.json');
        this.options = options;

        if (!fs.existsSync(this.filePath)) {
            this.store = this.options.defValue ?? null;
            this.save();
        } else {
            this.load();
        }

        this.startWatching();
    }

    get(): T {
        return this.store;
    }

    set(store: T) {
        this.store = store;
        if (this.options?.onChange) this.options.onChange(this.store, false);
    }

    load(): Error | null {
        try {
            this.store = JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as T;
            this.fillMissingValues();
            if (this.options?.onChange) this.options.onChange(this.store, false);
        } catch (e) {
            return e;
        }
    }

    save(): Error | null {
        if (!this.store) return new Error('Store is empty');

        try {
            this.stopWatching();
            fs.writeFileSync(this.filePath, JSON.stringify(this.store, null, 2));
            this.startWatching();
            return null;
        } catch (e) {
            return e;
        }
    }

    notifyChange() {
        if (this.options?.onChange) this.options.onChange(this.store, false);
    }

    fillMissingValues() {
        if (!this.options?.defValue) return;

        let save = false;

        for (const key in this.options?.defValue) {
            if (!Object.prototype.hasOwnProperty.call(this.store, key)) {
                this.store[key] = this.options.defValue[key];
                save = true;
            }
        }

        if (save) this.save();
    }

    private startWatching() {
        this.watch = fs.watch(this.filePath, event => {
            if (event === 'change') {
                console.log(`File ${this.filePath} changed. Reloading...`);
                this.load();
                if (this.options?.onChange) this.options.onChange(this.store, true);
            }
        });
    }

    private stopWatching() {
        if (this.watch) {
            this.watch.close();
            this.watch = null;
        }
    }
}