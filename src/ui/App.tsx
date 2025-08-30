import './App.css';
import {ReactElement, useEffect, useRef} from "react";
import SoundboardWin from "./components/windows/SoundboardWin";
import {Titlebar, TitlebarRef} from "./components/titlebar/Titlebar";
import ContextMenu from "./components/menu/ContextMenu";
import {useWindowContext} from "./context/WindowContext";

const PAGES: Record<string, ReactElement> = {
    main: <SoundboardWin/>,
    // settings: <SettingsWin/>,
    // button_settings: <ButtonSettingsWin/>,
    // media_selector: <MediaSelectorWin/>,
    // new_profile: <NewProfileWin/>
}

export const App = () => {
    const {ready, page, contextMenu, setTitlebar} = useWindowContext();
    const titlebarRef = useRef<TitlebarRef | null>(null);

    useEffect(() => {
        setTitlebar(titlebarRef.current);
    }, []);

    return (
        <>
            <Titlebar ref={titlebarRef}/>
            {ready &&
                <div className='app'>
                    {contextMenu && <ContextMenu {...contextMenu}/>}
                    {PAGES[page] || <div>Page not found</div>}
                </div>
            }
        </>
    )
}