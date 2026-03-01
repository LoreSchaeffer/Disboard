import {ElectronAPI} from "../../preload";

declare global {
    interface Window {
        electron: ElectronAPI;
    }
}

export type {ElectronAPI};