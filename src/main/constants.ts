import {app} from "electron";
import path from "path";

export const ROOT_DIR = app.getPath('userData');
export const AUDIO_DIR = path.join(ROOT_DIR, 'media', 'audio');
export const IMAGES_DIR = path.join(ROOT_DIR, 'media', 'images');