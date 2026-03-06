import {ComponentType} from "react";
import MusicBoardWin from "../windows/MusicBoardWin";
import SettingsWin from "../windows/SettingsWin";
import NewProfileWin from "../windows/NewProfileWin";
import DeleteConfirmationWin from "../windows/DeleteConfirmationWin";
import {Route} from "../../types";
import EmptyWin from "../windows/EmptyWin";
import GridBtnSettingsWin from "../windows/GridBtnSettingsWin";

export type RouteConfig = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component: ComponentType<any>;
    contexts?: AppProviderName[];
}

export type AppProviderName = 'player' | 'profiles';

export const appProviderPriorities: Record<AppProviderName, number> = {
    player: 1,
    profiles: 2,
};

export const ROUTES: Record<Route, RouteConfig> = {
    empty: {component: EmptyWin},

    music_board: {component: MusicBoardWin, contexts: ['player', 'profiles']},
    sfx_board: {component: EmptyWin, contexts: ['player', 'profiles']},
    ambient_board: {component: EmptyWin, contexts: ['player', 'profiles']},

    grid_btn_settings: {component: GridBtnSettingsWin, contexts: ['player', 'profiles']},
    grid_media_selector: {component: EmptyWin, contexts: ['player', 'profiles']},
    ambient_btn_settings: {component: EmptyWin, contexts: ['player', 'profiles']},
    ambient_media_selector: {component: EmptyWin, contexts: ['player', 'profiles']},

    settings: {component: SettingsWin, contexts: ['player']},
    new_profile: {component: NewProfileWin},
    delete_confirmation: {component: DeleteConfirmationWin},
}