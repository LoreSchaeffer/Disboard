import {SbButton, Song} from "../utils/store/profiles";
import {createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import {useData} from "./windowContext";

interface ButtonData {
    button: SbButton;
    setButton: Dispatch<SetStateAction<SbButton | undefined>>;
    buttonPos: { row: number, col: number } | undefined;
    hasButton: boolean;
}

export const ButtonContext = createContext<ButtonData | undefined>(undefined);

export const ButtonContextProvider: FC<{ children: ReactNode }> = ({children}) => {
    const {activeProfile} = useData();
    const [button, setButton] = useState<SbButton | undefined>(undefined);
    const [buttonPos, setButtonPos] = useState(undefined);
    const [hasButton, setHasButton] = useState(false);

    const configButton = () => {
        let btn = activeProfile.buttons.find(b => b.row === buttonPos.row && b.col === buttonPos.col);
        if (!btn) {
            btn = {
                row: buttonPos.row,
                col: buttonPos.col,
                song: null
            } as SbButton;
        }

        setButton(btn);
        setHasButton(true);
    }

    useEffect(() => {
        (window as any).electron.handleButton('button', (row: number, col: number) => {
            setButtonPos({row, col});
            if (activeProfile) configButton();
        });

        (window as any).electron.handleSong('song', (song: Song) => {
            setButton((prev) => {
                return {...prev, title: song.title, song: song};
            });
        });
    }, []);

    useEffect(() => {
        if (activeProfile && buttonPos !== undefined) configButton();
    }, [activeProfile, buttonPos]);

    return (
        <ButtonContext.Provider value={{button, setButton, buttonPos, hasButton}}>
            {children}
        </ButtonContext.Provider>
    );
};

export const useButton = () => {
    const context = useContext(ButtonContext);
    if (!context) throw new Error('buttonContext must be used within a ButtonContextProvider');
    return context;
}