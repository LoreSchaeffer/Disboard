import {setupWindowHandlers} from "./window";
import {setupSettingsHandlers} from "./settings";
import {setupGridProfilesHandlers} from "./grid-profiles";
import {setupTracksHandlers} from "./tracks";
import {setupSystemHandlers} from "./system";
import {setupMusicApiHandlers} from "./music-api";
import {setupDiscordBridgeHandlers} from "./discord";
import {setupPlayerHandlers} from "./player";
import {setupAmbientProfilesHandlers} from "./ambient-profiles";
import {setupRemoteServerHandlers} from "./remote-server";

export const registerIpcHandlers = () => {
    setupDiscordBridgeHandlers();
    setupMusicApiHandlers();
    setupPlayerHandlers();
    setupRemoteServerHandlers();
    setupGridProfilesHandlers();
    setupAmbientProfilesHandlers();
    setupSettingsHandlers();
    setupSystemHandlers();
    setupTracksHandlers();
    setupWindowHandlers();
}