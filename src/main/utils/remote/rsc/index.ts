import {setupGridProfilesRSHandlers} from "./grid-profiles";
import {setupAuthRemoteHandlers} from "./auth";
import {setupSettingsRSHandlers} from "./settings";
import {setupTracksRSHandlers} from "./tracks";
import {setupWindowRSHandlers} from "./window";
import {setupPlayerRSHandlers} from "./player";

export const registerRemoteServerHandlers = () => {
    setupAuthRemoteHandlers();
    setupGridProfilesRSHandlers();
    setupPlayerRSHandlers();
    setupSettingsRSHandlers();
    setupTracksRSHandlers();
    setupWindowRSHandlers();
}