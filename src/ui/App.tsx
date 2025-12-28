import './App.css';
import {ReactElement} from "react";
import SoundboardWin from "./components/windows/SoundboardWin";
import {useWindow} from "./context/WindowContext";

const PAGES: Record<string, ReactElement> = {
    main: <SoundboardWin/>,
}

export const App = () => {
    const {ready, page} = useWindow();

    if (!ready) return null;

    return (
        <div className='app'>
            {PAGES[page] || <div>Page not found</div>}
        </div>
    )
}