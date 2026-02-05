import {createContext, PropsWithChildren, ReactNode, useContext, useState} from "react";
import Titlebar from "../components/titlebar/Titlebar";

export type ContentPos = 'default' | 'centered';

type TitlebarContextType = {
    setTitle: (title: string) => void;
    setTitlebarContent: (children: ReactNode, position?: ContentPos) => void;
};

const TitlebarContext = createContext<TitlebarContextType | undefined>(undefined);

export const TitlebarProvider = ({children}: PropsWithChildren) => {
    const [title, setTitle] = useState<string>('Disboard');
    const [childrenContent, setChildrenContent] = useState<ReactNode>(null);
    const [contentPos, setContentPos] = useState<ContentPos>('default');

    const setTitlebarContent = (children: ReactNode, position: ContentPos = 'default') => {
        setChildrenContent(children);
        setContentPos(position);
    }

    return (
        <TitlebarContext.Provider value={{setTitle, setTitlebarContent}}>
            <Titlebar title={title} contentPos={contentPos}>{childrenContent}</Titlebar>
            {children}
        </TitlebarContext.Provider>
    );
};

export const useTitlebar = () => {
    const context = useContext(TitlebarContext);
    if (!context) throw new Error("useTitlebar must be used within a TitlebarProvider");
    return context;
};