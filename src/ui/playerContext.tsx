import {Song} from "../utils/store/profiles";
import {createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useState} from "react";

interface PlayerData {
    track: Song;
    setTrack: Dispatch<SetStateAction<Song>>
}

export const PlayerContext = createContext<PlayerData | undefined>(undefined);

export const PlayerContextProvider: FC<{ children: ReactNode }> = ({children}) => {
    const [track, setTrack] = useState<Song>();

    return (
        <PlayerContext.Provider value={{track, setTrack}}>
            {children}
        </PlayerContext.Provider>
    );
};

export const playerContext = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error('playerContext must be used within a PlayerContextProvider');
    return context;
}