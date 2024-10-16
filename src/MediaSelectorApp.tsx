import * as React from "react";
import {createRoot} from "react-dom/client";
import {WindowContextProvider} from "./ui/windowContext";
import {ButtonContextProvider} from "./ui/buttonContext";
import MediaSelectorWin from "./components/windows/MediaSelectorWin";

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <WindowContextProvider>
            <ButtonContextProvider>
                <MediaSelectorWin/>
            </ButtonContextProvider>
        </WindowContextProvider>
    </React.StrictMode>
);