import * as React from "react";
import {createRoot} from "react-dom/client";
import {App} from "./App";
import WindowProvider from "./context/WindowContext";
import {ContextMenuProvider} from "./context/ContextMenuContext";
import {TitlebarProvider} from "./context/TitlebarContext";
import {NavigationProvider} from "./context/NavigationContext";

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <WindowProvider>
            <NavigationProvider>
                <ContextMenuProvider>
                    <TitlebarProvider>
                        <App/>
                    </TitlebarProvider>
                </ContextMenuProvider>
            </NavigationProvider>
        </WindowProvider>
    </React.StrictMode>
);