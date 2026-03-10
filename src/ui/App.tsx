import './App.css';
import {useWindow} from "./context/WindowContext";
import Router from "./Router";

export const App = () => {
    const {ready} = useWindow();
    if (!ready) return null;

    return (
        <div className='app'>
            <Router/>
        </div>
    )
}