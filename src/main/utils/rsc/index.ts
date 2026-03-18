import {getTracksRSC} from "./get-tracks";
import {getProfilesRSC} from "./get-profiles";
import {openBoardRSC} from "./open-board";
import {pingRSC} from "./ping";
import {playButtonRSC} from "./play-button";
import {setVolumeRSC} from "./set-volume";
import {switchProfileRSC} from "./switch-profile";
import {stopButtonRSC} from "./stop-button";
import {playRSC} from "./play";
import {pauseRSC} from "./pause";
import {stopRSC} from "./stop";
import {nextRSC} from "./next";
import {previousRSC} from "./previous";

export const rscCommands = [
    getProfilesRSC,
    getTracksRSC,
    nextRSC,
    openBoardRSC,
    pauseRSC,
    pingRSC,
    playButtonRSC,
    playRSC,
    previousRSC,
    setVolumeRSC,
    stopButtonRSC,
    stopRSC,
    switchProfileRSC,
]