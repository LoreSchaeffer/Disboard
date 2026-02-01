import {setupWindowHandlers} from "./window";
import {setupSettingsHandlers} from "./settings";
import {setupProfilesHandlers} from "./profiles";
import {setupTracksHandlers} from "./tracks";
import {setupSystemHandlers} from "./system";
import {setupMusicApiHandlers} from "./music-api";
import {setupDiscordBridgeHandlers} from "./discord";

export const registerIpcHandlers = () => {
    setupWindowHandlers();
    setupSettingsHandlers();
    setupProfilesHandlers();
    setupTracksHandlers();
    setupSystemHandlers();
    setupMusicApiHandlers();
    setupDiscordBridgeHandlers();
}