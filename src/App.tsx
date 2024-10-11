import * as React from "react";
import {createRoot} from "react-dom/client";
import Window from "./components/Window";
import {WindowContextProvider} from "./ui/context";

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <WindowContextProvider>
            <Window/>
        </WindowContextProvider>
    </React.StrictMode>
);