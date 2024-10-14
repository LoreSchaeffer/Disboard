import "./Titlebar.css"
import TitlebarButton from "./TitlebarButton"
import {useData} from "../../ui/context";
import React from "react";

type TitlebarProps = {
    children?: React.ReactNode;
};

const Titlebar = ({children}: TitlebarProps) => {
    const {winId, resizable} = useData();

    return (
        <div className="titlebar">
            <div className={"left-data"}>
                <h1 className="window-title">Discore</h1>
                {children}
            </div>
            <TitlebarButton onClick={() => (window as any).electron.minimize(winId)} icon="minimize"/>
            {resizable && <TitlebarButton onClick={() => (window as any).electron.maximize(winId)} icon="maximize"/>}
            <TitlebarButton onClick={() => (window as any).electron.close(winId)} icon="close" hoverColor="var(--red)"/>
        </div>
    );
}

export default Titlebar;