import './App.css';
import {ReactElement, useEffect, useState} from "react";
import SoundboardWin from "./windows/SoundboardWin";
import {useWindow} from "./context/WindowContext";
import {useNavigation} from "./context/NavigationContext";
import {PlayerProvider} from "./context/PlayerContext";
import MediaSelectorWin from "./windows/MediaSelectorWin";
import ButtonSettingsWin from "./windows/ButtonSettingsWin";

const PAGES: {
    name: string;
    component: ReactElement;
    usePlayer: boolean;
}[] = [
    {name: 'main', component: <SoundboardWin/>, usePlayer: true},
    // {name: 'settings', component: <SettingsWin/>, usePlayer: false},
    {name: 'button_settings', component: <ButtonSettingsWin/>, usePlayer: true},
    {name: 'media_selector', component: <MediaSelectorWin/>, usePlayer: true},
];

const FallbackPage = () => <div>Page not found!</div>

export const App = () => {
    const {ready} = useWindow();
    const {visibleStack} = useNavigation();
    const [loadedPages, setLoadedPages] = useState<Set<string>>(new Set());

    useEffect(() => {
        const current = visibleStack[visibleStack.length - 1];
        if (current) {
            setLoadedPages(prev => {
                if (prev.has(current)) return prev;
                return new Set(prev).add(current);
            });
        }
    }, [visibleStack]);

    if (!ready) return null;

    const currentVisiblePage = visibleStack[visibleStack.length - 1];
    const isValidPage = PAGES.some(p => p.name === currentVisiblePage);

    return (
        <div className='app'>
            {PAGES.map((page) => {
                if (!loadedPages.has(page.name)) return null;

                const stackIndex = visibleStack.indexOf(page.name);
                const isVisible = stackIndex !== -1;

                const content = page.usePlayer ? (
                    <PlayerProvider>{page.component}</PlayerProvider>
                ) : (
                    page.component
                );

                return (
                    <div
                        key={page.name}
                        className="pageContainer"
                        style={{
                            display: isVisible ? 'block' : 'none',
                            zIndex: isVisible ? 10 + stackIndex : 0,
                        }}
                    >
                        {content}
                    </div>
                );
            })}

            {!isValidPage && <FallbackPage/>}
        </div>
    )
}