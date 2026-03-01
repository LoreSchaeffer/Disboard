import {setupWindowHandlers} from "./window";
import {setupSettingsHandlers} from "./settings";
import {setupProfilesHandlers} from "./profiles";
import {setupTracksHandlers} from "./tracks";
import {setupSystemHandlers} from "./system";
import {setupMusicApiHandlers} from "./music-api";
import {setupDiscordBridgeHandlers} from "./discord";
import {setupPlayerHandlers} from "./player";

export const registerIpcHandlers = () => {
    setupDiscordBridgeHandlers();
    setupMusicApiHandlers();
    setupPlayerHandlers();
    setupProfilesHandlers();
    setupSettingsHandlers();
    setupSystemHandlers();
    setupTracksHandlers();
    setupWindowHandlers();
}