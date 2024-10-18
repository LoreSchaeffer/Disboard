import * as React from "react";
import {createRoot} from "react-dom/client";
import {WindowContextProvider} from "./ui/windowContext";
import NewProfileWin from "./components/windows/NewProfileWin";

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <WindowContextProvider>
            <NewProfileWin/>
        </WindowContextProvider>
    </React.StrictMode>
);