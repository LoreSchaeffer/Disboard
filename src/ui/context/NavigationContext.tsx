import {createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState} from "react";
import {useWindow} from "./WindowContext";

export type NavigationOptions = {
    replace?: boolean;
    data?: unknown;
}

type NavigationContextType = {
    currentPage: StackEntry;
    visibleStack: StackEntry[];
    navigate: (page: string, options: NavigationOptions) => void;
    back: () => void;
    isInStack: (page: string) => boolean;
}

export type StackEntry = {
    page: string;
    data?: unknown;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({children}: PropsWithChildren) => {
    const {page} = useWindow();
    const [visibleStack, setVisibleStack] = useState<StackEntry[]>([{page: page}]);
    const currentPage = visibleStack[visibleStack.length - 1];
    const lastExternalPage = useRef<string>(page);

    const navigate = useCallback((newPage: string, options: NavigationOptions = {replace: true}) => {
        setVisibleStack(prevStack => {
            if (options.replace) {
                return [{page: newPage, data: options.data}];
            } else {
                if (prevStack.find(e => e.page === newPage)) return prevStack;
                return [...prevStack, {page: newPage, data: options.data}];
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

    const isInStack = (page: string) => {
        return visibleStack.find(e => e.page === page) !== undefined;
    }

    useEffect(() => {
        if (page && page !== lastExternalPage.current) {
            lastExternalPage.current = page;
            navigate(page, {replace: true});
        }
    }, [page, navigate]);

    return (
        <NavigationContext.Provider value={{
            currentPage,
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