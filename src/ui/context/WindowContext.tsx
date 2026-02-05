import {createContext, PropsWithChildren, useContext, useEffect, useRef, useState} from "react";
import {Settings} from "../../types/settings";
import {WindowData} from "../../types/window";
import {Route} from "../../types/routes";

type WindowContextType = {
    ready: boolean;
    parent: number | null;
    resizable: boolean;
    route: Route | null;
    settings: Settings | null;
    updateSettingsAsync?: (settings: Partial<Settings>) => void;
    data: WindowData<unknown> | null;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export default function WindowProvider({children}: PropsWithChildren) {
    const [ready, setReady] = useState<boolean>(false);
    const [parent, setParent] = useState<number | null>(null);
    const [resizable, setResizable] = useState<boolean>(false);
    const [route, setRoute] = useState<Route | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [data, setData] = useState<WindowData<unknown> | null>(null);

    const saveSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            const winData = await window.electron.getWindow();
            setParent(winData.parent);
            setResizable(winData.resizable);
            setRoute(winData.route);
            setData(winData.data || null);

            const initialSettings = await window.electron.getSettings();
            setSettings(initialSettings);
        };

        loadInitialData();

        const unsubSettings = window.electron.onSettingsChanged(settings => {
            setSettings(settings);
        });

        return () => {
            unsubSettings();

            if (saveSettingsTimeoutRef.current) {
                clearTimeout(saveSettingsTimeoutRef.current);
                saveSettingsTimeoutRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (settings && route) {
            setReady(true);
        }
    }, [settings, route]);

    const updateSettingsAsync = (newSettings: Partial<Settings>) => {
        if (!settings) return;

        const updatedSettings = {...settings, ...newSettings};
        setSettings(updatedSettings);

        if (saveSettingsTimeoutRef.current) clearTimeout(saveSettingsTimeoutRef.current);
        saveSettingsTimeoutRef.current = setTimeout(() => {
            window.electron.updateSettings(newSettings);
            saveSettingsTimeoutRef.current = null;
        }, 250);
    }

    return (
        <WindowContext.Provider value={{
            ready,
            parent,
            resizable,
            route,
            settings,
            updateSettingsAsync,
            data,
        }}>
            {children}
        </WindowContext.Provider>
    )
}

export function useWindow() {
    const context = useContext(WindowContext);
    if (context === undefined) throw new Error('useWindow must be used within a WindowProvider');
    return context;
}