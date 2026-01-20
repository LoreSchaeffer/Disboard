import {Profile, Btn, SbBtn, SbProfile, Track} from "../../types/data";
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
    if (!track) return null;

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
    return profileBtns.map(pb => convertBtnToSbBtn(pb, tracks)).filter((btn) => btn !== null);
}

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