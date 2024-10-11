import "./Titlebar.css"
import TitlebarButton from "./TitlebarButton"
import {useData} from "../../ui/context";

const Titlebar = () => {
    const {winId} = useData();

    return (
        <div className="titlebar">
            <h1 className="window-title">Discore</h1>
            <TitlebarButton onClick={() => (window as any).electron.minimize(winId)} icon="minimize"/>
            <TitlebarButton onClick={() => (window as any).electron.maximize(winId)} icon="maximize"/>
            <TitlebarButton onClick={() => (window as any).electron.close(winId)} icon="close" hoverColor="var(--red)"/>
        </div>
    );
}

export default Titlebar;