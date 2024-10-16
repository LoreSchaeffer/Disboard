import Titlebar from "../titlebar/Titlebar";
import {useData} from "../../ui/windowContext";
import ContextMenu from "../context/ContextMenu";
import React from "react";

type WindowProps = {
    children?: React.ReactNode;
    titlebar?: React.ReactNode;
};

const Window = ({children, titlebar}: WindowProps) => {
    const {ready, contextMenu} = useData();

    if (!ready) {
        return <Titlebar/>;
    } else {
        return (
            <>
                <Titlebar>
                    {titlebar}
                </Titlebar>
                <div className="app">
                    {contextMenu && <ContextMenu {...contextMenu}/>}
                    {children}
                </div>
            </>
        );
    }
};

export default Window;