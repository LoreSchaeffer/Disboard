import {AmbientProfile, GridBtn, GridProfile, SbAmbientProfile, SbGridBtn, SbGridProfile, Track} from "../../types";
import {getGridBtnId} from "../../shared/utils";
import {tracksStore} from "../storage/tracks-store";

const getTracksRecord = (): Record<string, Track> => {
    const record: Record<string, Track> = {};
    tracksStore.get('tracks').forEach(track => record[track.id] = track);
    return record;
}

const buildSbGridBtn = (gridBtn: GridBtn, track?: Track): SbGridBtn => {
    return {
        ...gridBtn,
        id: getGridBtnId(gridBtn.row, gridBtn.col),
        track: track,
        title: gridBtn.title || track?.title,
    };
};

export const convertGridBtn2SbGridBtn = (gridBtn: GridBtn): SbGridBtn => {
    const track = tracksStore.get('tracks').find(t => t.id === gridBtn.track);
    return buildSbGridBtn(gridBtn, track);
};

export const convertGridBtns2SbGridBtns = (gridBtns: GridBtn[]): SbGridBtn[] => {
    const tracks: Record<string, Track> = getTracksRecord();

    return gridBtns.map(btn => {
        const track = tracks[btn.track];
        return buildSbGridBtn(btn, track);
    });
}

export const convertGridProfile2SbGridProfile = (gridProfile: GridProfile): SbGridProfile => {
    return {
        ...gridProfile,
        buttons: convertGridBtns2SbGridBtns(gridProfile.buttons)
    }
}

export const convertAmbientProfile2SbAmbientProfile = (ambientProfile: AmbientProfile): SbAmbientProfile => {
    return {
        ...ambientProfile,
        // TODO
    }
}