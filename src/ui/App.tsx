import './App.css';
import {ReactElement, useEffect, useState} from "react";
import SoundboardWin from "./windows/SoundboardWin";
import {useWindow} from "./context/WindowContext";
import {StackEntry, useNavigation} from "./context/NavigationContext";
import {PlayerProvider} from "./context/PlayerContext";
import MediaSelectorWin from "./windows/MediaSelectorWin";
import ButtonSettingsWin from "./windows/ButtonSettingsWin";
import SettingsWin from "./windows/SettingsWin";
import NewProfileWin from "./windows/NewProfileWin";

type PageConfig = {
    component: ReactElement;
    usePlayer: boolean;
}

const PAGES: Record<string, PageConfig> = {
    'main': {component: <SoundboardWin/>, usePlayer: true},
    'button_settings': {component: <ButtonSettingsWin/>, usePlayer: true},
    'media_selector': {component: <MediaSelectorWin/>, usePlayer: true},

    'settings': {component: <SettingsWin/>, usePlayer: true},
    'new_profile': {component: <NewProfileWin/>, usePlayer: false},
}

const FallbackPage = () => <div>Page not found!</div>

export const App = () => {
    const {ready} = useWindow();
    const {visibleStack} = useNavigation();

    if (!ready) return null;

    return (
        <div className='app'>
            {visibleStack.map((entry, index) => {
                const pageConfig = PAGES[entry.page];
                if (!pageConfig) {
                    if (index === visibleStack.length - 1) return <FallbackPage key={entry.page}/>;
                    return null;
                }

                const isTopPage = index === visibleStack.length - 1;
                const content = pageConfig.usePlayer ? (
                    <PlayerProvider>{pageConfig.component}</PlayerProvider>
                ) : (
                    pageConfig.component
                );

                return (
                    <div
                        key={entry.page}
                        className="pageContainer"
                        style={{
                            display: isTopPage ? 'block' : 'none',
                            zIndex: 10 + index,
                        }}
                    >
                        {content}
                    </div>
                )
            })}
        </div>
    )
}