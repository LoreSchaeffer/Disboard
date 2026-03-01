import {Profile, Btn, SbBtn, SbProfile, Track, Sfx, SfxProfile} from "../../types/data";
import {tracksStore} from "./store";

export const generateButtonId = (row: number, col: number): string => {
    return `btn_${row}_${col}`;
}

export const getPosFromButtonId = (buttonId: string): { row: number, col: number } | null => {
    const match = buttonId.match(/^btn_(\d+)_(\d+)$/);
    if (!match) return null;
    const row = parseInt(match[1], 10);
    const col = parseInt(match[2], 10);
    return {row, col};
}

export const convertBtnToSbBtn = (profileBtn: Btn, tracks: Track[]): SbBtn | null => {
    const track = tracks.find(t => t.id === profileBtn.track);

    return {
        id: generateButtonId(profileBtn.row, profileBtn.col),
        row: profileBtn.row,
        col: profileBtn.col,
        track: track,
        title: profileBtn.title || track.title,
        style: profileBtn.style,
        cropOptions: profileBtn.cropOptions
    };
}

export const convertBtnsToSbBtns = (profileBtns: Btn[]): SbBtn[] => {
    const tracks = tracksStore.get('tracks');
    return profileBtns.map(pb => convertBtnToSbBtn(pb, tracks));
}

// TODO To be removed?
export const convertSbBtnToBtn = (sbBtn: SbBtn): Btn => {
    return {
        row: sbBtn.row,
        col: sbBtn.col,
        title: sbBtn.title,
        style: sbBtn.style,
        cropOptions: sbBtn.cropOptions,
        track: sbBtn.track.id
    }
}

// TODO To be removed?
export const convertSbBtnsToBtns = (sbBtns: SbBtn[]): Btn[] => {
    return sbBtns.map(sbBtn => convertSbBtnToBtn(sbBtn));
}

export const convertProfileToSbProfile = (profile: Profile): SbProfile => {
    return {
        id: profile.id,
        name: profile.name,
        rows: profile.rows,
        cols: profile.cols,
        buttons: convertBtnsToSbBtns(profile.buttons)
    }
}

export const convertSfxToSbSfx = (sfx: Sfx) => {
    // TODO To be implemented
    return null;
}

export const convertSfxsToSbSfxs = (sfxs: Sfx[]) => {
    // TODO To be implemented
    return [];
}

export const convertSfxProfileToSbSfxProfile = (sfxProfile: SfxProfile) => {
    // TODO To be implemented
    return null;
}