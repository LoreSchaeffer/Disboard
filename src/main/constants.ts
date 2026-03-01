import {app} from "electron";
import path from "path";

export const ROOT_DIR = app.getPath('userData');
export const USER_DATA = path.join(ROOT_DIR, 'data');
export const CONFIG_DATA = path.join(USER_DATA, 'config');
export const TRACKS_DIR = path.join(USER_DATA, 'media', 'tracks');
export const SFX_DIR = path.join(USER_DATA, 'media', 'sfx');
export const THUMBNAILS_DIR = path.join(USER_DATA, 'media', 'thumbnails');

export const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';

export const HEX_COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;