import {setupWindowHandlers} from "./window";
import {setupSettingsHandlers} from "./settings";
import {setupProfilesHandlers} from "./profiles";
import {setupTracksHandlers} from "./tracks";
import {setupSystemHandlers} from "../utils/system";
import {setupMusicApiHandlers} from "./music-api";

export const registerIpcHandlers = () => {
    setupWindowHandlers();
    setupSettingsHandlers();
    setupProfilesHandlers();
    setupTracksHandlers();
    setupSystemHandlers();
    setupMusicApiHandlers();
}