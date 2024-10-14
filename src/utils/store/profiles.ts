import {generateUUID} from "../utils";
import {Store} from "./store";

export interface Profile {
    id: string;
    name: string;
    rows: number;
    cols: number;
    buttons: SbButton[];
}

export interface SbButton {
    row: number;
    col: number;
    title: string;
    text_color: string;
    text_color_hover: string;
    background_color: string;
    background_color_hover: string;
    border_color: string;
    border_color_hover: string;
    song: Song;
}

export interface Song {
    title: string;
    original_url?: string;
    uri: string;
    duration: number;
    thumbnail: string;
    start_time: number;
    start_time_unit: string;
    end_time_type: string;
    end_time: number;
    end_time_unit: string;
    // TODO Custom volume?
}

const defProfile: Profile = {
    id: generateUUID(),
    name: 'Default',
    rows: 8,
    cols: 10,
    buttons: []
};

export class Profiles {
    private store: Store;

    constructor(onReload?: (store: Store) => void) {
        this.store = new Store('profiles.json', [defProfile], onReload);
    }

    get(): Profile[] {
        return this.store.get() as Profile[];
    }

    set(profiles: Profile[]) {
        this.store.set(profiles);
    }

    save() {
        this.store.save();
    }

    async saveAsync() {
        await this.store.save();
    }
}