import * as React from "react";
import {createRoot} from "react-dom/client";
import {App} from "./App";
import WindowContextProvider from "./context/WindowContext";

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <WindowContextProvider>
            <App/>
        </WindowContextProvider>
    </React.StrictMode>
);