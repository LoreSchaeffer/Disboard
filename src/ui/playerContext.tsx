import {Song} from "../utils/store/profiles";
import {createContext, Dispatch, FC, ReactNode, SetStateAction, useContext, useEffect, useState} from "react";
import {useData} from "./windowContext";

interface PlayerData {
    song: Song;
    setSong: Dispatch<SetStateAction<Song>>
    duration: number;
    setDuration: Dispatch<SetStateAction<number>>;
    queue: Song[];
    setQueue: Dispatch<SetStateAction<Song[]>>;
}

export const PlayerContext = createContext<PlayerData | undefined>(undefined);

export const PlayerContextProvider: FC<{ children: ReactNode }> = ({children}) => {
    const {mainPlayer} = useData();
    const [song, setSong] = useState<Song>();
    const [duration, setDuration] = useState<number>(0);
    const [queue, setQueue] = useState<Song[]>([]);

    useEffect(() => {
        mainPlayer.setQueue(queue);
    }, [setQueue]);

    return (
        <PlayerContext.Provider value={{
            song, setSong,
            duration, setDuration,
            queue, setQueue
        }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) throw new Error('playerContext must be used within a PlayerContextProvider');
    return context;
}