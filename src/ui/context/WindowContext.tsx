import {createContext, PropsWithChildren, useContext, useEffect, useRef, useState} from "react";
import {DeepPartial, Route, Settings, StaticWinData, WindowInfo} from "../../types";

type WindowContextType = {
    ready: boolean;
    parent: number | null;
    resizable: boolean;
    route: Route | null;
    settings: Settings | null;
    updateSettingsAsync: (settings: DeepPartial<Settings>) => void;
    data: StaticWinData<unknown> | null;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export default function WindowProvider({children}: PropsWithChildren) {
    const [ready, setReady] = useState<boolean>(false);
    const [parent, setParent] = useState<number | null>(null);
    const [resizable, setResizable] = useState<boolean>(false);
    const [route, setRoute] = useState<Route | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [data, setData] = useState<StaticWinData<unknown> | null>(null);

    const saveSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            const winInfo: WindowInfo = await window.electron.window.getInfo();
            setParent(winInfo.parent);
            setResizable(winInfo.resizable);
            setRoute(winInfo.route);
            setData(winInfo.data || null);

            setSettings(await window.electron.settings.get());
        };

        loadInitialData();

        const unsubSettings = window.electron.settings.onChanged((settings: Settings) => {
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

        setSettings(prevSettings =>
            prevSettings ? {...prevSettings, ...newSettings} : null
        );

        if (saveSettingsTimeoutRef.current) clearTimeout(saveSettingsTimeoutRef.current);
        saveSettingsTimeoutRef.current = setTimeout(() => {
            window.electron.settings.set(newSettings);
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