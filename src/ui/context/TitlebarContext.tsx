import {createContext, PropsWithChildren, ReactNode, useContext, useState} from "react";
import Titlebar from "../components/titlebar/Titlebar";

type TitlebarContextType = {
    setTitle: (title: string) => void;
    setTitlebarContent: (children: ReactNode) => void;
};

const TitlebarContext = createContext<TitlebarContextType | undefined>(undefined);

export const TitlebarProvider = ({children}: PropsWithChildren) => {
    const [title, setTitle] = useState<string>('Disboard');
    const [childrenContent, setChildrenContent] = useState<ReactNode>(null);

    return (
        <TitlebarContext.Provider value={{setTitle, setTitlebarContent: setChildrenContent}}>
            <Titlebar title={title}>{childrenContent}</Titlebar>
            {children}
        </TitlebarContext.Provider>
    );
};

export const useTitlebar = () => {
    const context = useContext(TitlebarContext);
    if (!context) throw new Error("useTitlebar must be used within a TitlebarProvider");
    return context;
};