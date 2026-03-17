import {createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState} from "react";
import {DeepPartial, Route, Settings, StaticWinData, WindowInfo} from "../../types";
import {deepMerge} from "../../main/utils/objects";

type WindowContextType = {
    ready: boolean;
    parent: number | null;
    resizable: boolean;
    route: Route | null;
    settings: Settings | null;
    updateSettingsAsync: (settings: DeepPartial<Settings>) => void;
    data: StaticWinData<unknown> | null;
    registerShortcut: (combo: string, callback: (e: KeyboardEvent) => void) => void;
    unregisterShortcut: (combo: string) => void;
}

const WindowContext = createContext<WindowContextType | undefined>(undefined);

export default function WindowProvider({children}: PropsWithChildren) {
    const [ready, setReady] = useState<boolean>(false);
    const [parent, setParent] = useState<number | null>(null);
    const [resizable, setResizable] = useState<boolean>(false);
    const [route, setRoute] = useState<Route | null>(null);
    const [settings, setSettings] = useState<Settings | null>(null);
    const [data, setData] = useState<StaticWinData<unknown> | null>(null);

    const shortcutRegistry = useRef<Map<string, (e: KeyboardEvent) => void>>(new Map());
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

        const handleShortcut = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            const keys = [];

            if (e.ctrlKey || e.metaKey) keys.push('ctrl');
            if (e.shiftKey) keys.push('shift');
            if (e.altKey) keys.push('alt');

            const key = e.key.toLowerCase();
            if (!['control', 'shift', 'alt', 'meta'].includes(key)) keys.push(key === ' ' ? 'space' : key);

            const combo = keys.join('+');

            if (settings && settings.debug) console.log('Combo received: ', combo);

            const callback = shortcutRegistry.current.get(combo);
            if (callback) {
                e.preventDefault();
                callback(e);
            }
        }

        window.addEventListener('keydown', handleShortcut);

        return () => {
            window.removeEventListener('keydown', handleShortcut);

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

    const updateSettingsAsync = (newSettings: DeepPartial<Settings>) => {
        setSettings(prevSettings =>
            prevSettings ? deepMerge(prevSettings, newSettings) : null
        );

        if (saveSettingsTimeoutRef.current) clearTimeout(saveSettingsTimeoutRef.current);
        saveSettingsTimeoutRef.current = setTimeout(() => {
            window.electron.settings.set(newSettings);
            saveSettingsTimeoutRef.current = null;
        }, 250);
    }

    const registerShortcut = useCallback((combo: string, callback: (e: KeyboardEvent) => void) => {
        shortcutRegistry.current.set(combo.toLowerCase(), callback);
    }, []);

    const unregisterShortcut = useCallback((combo: string) => {
        shortcutRegistry.current.delete(combo.toLowerCase());
    }, []);

    return (
        <WindowContext.Provider value={{
            ready,
            parent,
            resizable,
            route,
            settings,
            updateSettingsAsync,
            data,
            registerShortcut,
            unregisterShortcut
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

export function useShortcut(combo: string, callback: (e: KeyboardEvent) => void) {
    const {registerShortcut, unregisterShortcut} = useWindow();

    const callbackRef = useRef(callback);

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => callbackRef.current(e);
        registerShortcut(combo, handler);
        return () => unregisterShortcut(combo);
    }, [combo, registerShortcut, unregisterShortcut]);
}