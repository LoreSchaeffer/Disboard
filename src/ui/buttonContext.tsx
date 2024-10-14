import {SbButton} from "../utils/store/profiles";
import {createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useState} from "react";

interface ButtonData {
    button: SbButton;
    setButton: Dispatch<SetStateAction<SbButton>>;
}

export const ButtonContext = createContext<ButtonData | undefined>(undefined);

export const ButtonContextProvider: FC<{ children: ReactNode }> = ({children}) => {
    const [button, setButton] = useState<SbButton | undefined>(undefined);

    return (
        <ButtonContext.Provider value={{
            button, setButton
        }}>
            {children}
        </ButtonContext.Provider>
    );
};

export const useButton = () => {
    const context = useContext(ButtonContext);
    if (!context) throw new Error('buttonContext must be used within a ButtonContextProvider');
    return context;
}