import {ComponentType} from "react";
import MainSoundboardWin from "../windows/MainSoundboardWin";
import ButtonSettingsWin from "../windows/ButtonSettingsWin";
import MediaSelectorWin from "../windows/MediaSelectorWin";
import SettingsWin from "../windows/SettingsWin";
import NewProfileWin from "../windows/NewProfileWin";
import DeleteConfirmationWin from "../windows/DeleteConfirmationWin";
import {Route} from "../../types/routes";
import EmptyWin from "../windows/EmptyWin";

export type RouteConfig = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ComponentType<any>;
    usePlayer?: boolean;
    useProfiles?: boolean;
    useSfxProfiles?: boolean;
}

export const ROUTES: Record<Route, RouteConfig> = {
    empty: {component: EmptyWin},

    main: {component: MainSoundboardWin, usePlayer: true, useProfiles: true},
    click: {component: MainSoundboardWin, usePlayer: true, useProfiles: true},
    sfx: {component: MainSoundboardWin, usePlayer: true, useSfxProfiles: true},
    button_settings: {component: ButtonSettingsWin, usePlayer: true},
    media_selector: {component: MediaSelectorWin, usePlayer: true},

    settings: {component: SettingsWin, usePlayer: true},
    new_profile: {component: NewProfileWin},
    delete_confirmation: {component: DeleteConfirmationWin},
}