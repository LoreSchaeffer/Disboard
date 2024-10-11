import {Store} from "./store";

export interface SettingsData {
    width: number;
    height: number;
    volume: number;
    output_device: string;
    loop: boolean;
    font_size: number;
    active_profile: string;
    show_images: boolean;
}

const defSettings: SettingsData = {
    width: 1366,
    height: 768,
    volume: 50,
    output_device: 'default',
    loop: false,
    font_size: 13,
    active_profile: null,
    show_images: true
};

export class Settings {
    private store: Store;

    constructor() {
        this.store = new Store('settings.json', defSettings);
    }

    get(): SettingsData {
        return this.store.get() as SettingsData;
    }

    set(settings: SettingsData) {
        this.store.set(settings);
    }

    save() {
        this.store.save();
    }

    async saveAsync() {
        await this.store.save();
    }
}