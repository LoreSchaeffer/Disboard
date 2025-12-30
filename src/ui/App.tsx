import './App.css';
import {ReactElement, useEffect, useState} from "react";
import SoundboardWin from "./components/windows/SoundboardWin";
import {useWindow} from "./context/WindowContext";
import {useNavigation} from "./context/NavigationContext";
import SettingsWin from "./components/windows/SettingsWin";

const PAGES: Record<string, ReactElement> = {
    main: <SoundboardWin/>,
    settings: <SettingsWin/>,
}

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

    return (
        <div className='app'>
            {Object.entries(PAGES).map(([key, component]) => {
                if (!loadedPages.has(key)) return null;
                const stackIndex = visibleStack.indexOf(key);
                const isVisible = stackIndex !== -1;

                return (
                    <div
                        key={key}
                        className="pageContainer"
                        style={{
                            display: isVisible ? 'block' : 'none',
                            zIndex: isVisible ? 10 + stackIndex : 0,
                        }}
                    >
                        {component}
                    </div>
                );
            })}

            {!(visibleStack[visibleStack.length - 1] in PAGES) && <FallbackPage/>}
        </div>
    )
}