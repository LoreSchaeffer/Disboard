import {createContext, PropsWithChildren, useCallback, useContext, useEffect, useRef, useState} from "react";
import {useWindow} from "./WindowContext";

type NavigationContextType = {
    currentPage: string;
    navigate: (page: string, replace?: boolean) => void;
    back: () => void;
    visibleStack: string[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const NavigationProvider = ({children}: PropsWithChildren) => {
    const {page} = useWindow();
    const [visibleStack, setVisibleStack] = useState<string[]>([page]);
    const currentPage = visibleStack[visibleStack.length - 1];
    const lastExternalPage = useRef<string>(page);

    const navigate = useCallback((newPage: string, replace: boolean = true) => {
        setVisibleStack(prevStack => {
            if (replace) {
                return [newPage];
            } else {
                if (prevStack[prevStack.length - 1] === newPage) return prevStack;
                return [...prevStack, newPage];
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

    useEffect(() => {
        if (page && page !== lastExternalPage.current) {
            lastExternalPage.current = page;
            navigate(page, true);
        }
    }, [page, navigate]);

    return (
        <NavigationContext.Provider value={{currentPage, visibleStack, navigate, back}}>
            {children}
        </NavigationContext.Provider>
    );
}

export const useNavigation = () => {
    const context = useContext(NavigationContext);
    if (!context) throw new Error("useNavigation must be used within a NavigationProvider");
    return context;
};