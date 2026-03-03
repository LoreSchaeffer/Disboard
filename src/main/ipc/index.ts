import {setupWindowHandlers} from "./window";
import {setupSettingsHandlers} from "./settings";
import {setupGridProfilesHandlers} from "./grid-profiles";
import {setupTracksHandlers} from "./tracks";
import {setupSystemHandlers} from "./system";
import {setupMusicApiHandlers} from "./music-api";
import {setupDiscordBridgeHandlers} from "./discord";
import {setupPlayerHandlers} from "./player";

export const registerIpcHandlers = () => {
    setupDiscordBridgeHandlers();
    setupMusicApiHandlers();
    setupPlayerHandlers();
    setupGridProfilesHandlers();
    setupSettingsHandlers();
    setupSystemHandlers();
    setupTracksHandlers();
    setupWindowHandlers();
}