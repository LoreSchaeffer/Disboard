import {Song} from "../utils/store/profiles";
import {createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useState} from "react";

interface PlayerData {
    song: Song;
    setSong: Dispatch<SetStateAction<Song>>
    duration: number;
    setDuration: Dispatch<SetStateAction<number>>;
    isPlaylist: boolean;
    setIsPlaylist: Dispatch<SetStateAction<boolean>>;
}

export const PlayerContext = createContext<PlayerData | undefined>(undefined);

export const PlayerContextProvider: FC<{ children: ReactNode }> = ({children}) => {
    const [song, setSong] = useState<Song>();
    const [duration, setDuration] = useState<number>(0);
    const [isPlaylist, setIsPlaylist] = useState<boolean>(false);

    return (
        <PlayerContext.Provider value={{
            song, setSong,
            duration, setDuration,
            isPlaylist, setIsPlaylist
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const playerContext = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error('playerContext must be used within a PlayerContextProvider');
    return context;
}