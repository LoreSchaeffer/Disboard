import * as React from "react";
import {createRoot} from "react-dom/client";
import {WindowContextProvider} from "./ui/windowContext";
import ButtonSettingsWin from "./components/windows/ButtonSettingsWin";
import {ButtonContextProvider} from "./ui/buttonContext";

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <WindowContextProvider>
            <ButtonContextProvider>
                <ButtonSettingsWin/>
            </ButtonContextProvider>
        </WindowContextProvider>
    </React.StrictMode>
);