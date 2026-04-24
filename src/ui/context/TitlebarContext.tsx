import {createContext, PropsWithChildren, ReactNode, useContext, useState} from "react";
import Titlebar from "../components/titlebar/Titlebar";

export type ContentPos = 'default' | 'centered';

type TitlebarContextType = {
    setTitle: (title: string) => void;
    setMainContent: (children: ReactNode, position?: ContentPos) => void;
    setRightContent: (children: ReactNode) => void;
};

const TitlebarContext = createContext<TitlebarContextType | undefined>(undefined);

export const TitlebarProvider = ({children}: PropsWithChildren) => {
    const [title, setTitle] = useState<string>('Disboard');
    const [mainContent, setMainContent] = useState<ReactNode>(null);
    const [mainContentPos, setMainContentPos] = useState<ContentPos>('default');
    const [rightContent, setRightContent] = useState<ReactNode>(null);


    return (
        <TitlebarContext.Provider value={{
            setTitle,
            setMainContent: (children: ReactNode, position: ContentPos = 'default') => {
                setMainContent(children);
                setMainContentPos(position);
            },
            setRightContent: (children: ReactNode) => setRightContent(children),
        }}>
            <Titlebar
                title={title}
                contentPos={mainContentPos}
                rightContent={rightContent}
            >{mainContent}</Titlebar>
            {children}
        </TitlebarContext.Provider>
    );
};

export const useTitlebar = () => {
    const context = useContext(TitlebarContext);
    if (!context) throw new Error("useTitlebar must be used within a TitlebarProvider");
    return context;
};