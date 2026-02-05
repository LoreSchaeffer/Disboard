import {createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState} from "react";
import {useWindow} from "./WindowContext";
import {Route} from "../../types/routes";

export type NavigationOptions = {
    replace?: boolean;
    data?: unknown;
}

type NavigationContextType = {
    currentRoute: StackEntry;
    visibleStack: StackEntry[];
    navigate: (route: Route, options: NavigationOptions) => void;
    back: () => void;
    isInStack: (page: Route) => boolean;
}

export type StackEntry = {
    route: Route;
    data?: unknown;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({children}: PropsWithChildren) => {
    const {route} = useWindow();
    const [visibleStack, setVisibleStack] = useState<StackEntry[]>([{route: route}]);
    const currentRoute = visibleStack[visibleStack.length - 1];
    const lastExternalRoute = useRef<Route>(route);

    const navigate = useCallback((newRoute: Route, options: NavigationOptions = {replace: true}) => {
        setVisibleStack(prevStack => {
            if (options.replace) {
                return [{route: newRoute, data: options.data}];
            } else {
                if (prevStack.find(e => e.route === newRoute)) return prevStack;
                return [...prevStack, {route: newRoute, data: options.data}];
            }
        });
    }, []);

    const back = useCallback(() => {
        setVisibleStack(prevStack => {
            if (prevStack.length <= 1) return prevStack;
            const newStack = [...prevStack];
            newStack.pop();
            return newStack;
        });
    }, []);

    const isInStack = (route: Route) => {
        return visibleStack.find(e => e.route === route) !== undefined;
    }

    useEffect(() => {
        if (route && route !== lastExternalRoute.current) {
            lastExternalRoute.current = route;
            navigate(route, {replace: true});
        }
    }, [route, navigate]);

    return (
        <NavigationContext.Provider value={{
            currentRoute: currentRoute,
            visibleStack,
            navigate,
            back,
            isInStack,
        }}>
            {children}
        </NavigationContext.Provider>
    );
}

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error("useNavigation must be used within a NavigationProvider");
    return context;
};