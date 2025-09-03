import {Player} from "../utils/player";
import {createContext, PropsWithChildren, useContext, useRef} from "react";

type PlayerContextType = {
    player: Player;
    previewPlayer: Player;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export default function PlayerContextProvider({children}: PropsWithChildren) {
    const playerRef = useRef<Player>(new Player());
    const previewPlayerRef = useRef<Player>(new Player());

    return (
        <PlayerContext.Provider value={{
            player: playerRef.current,
            previewPlayer: previewPlayerRef.current
        }}>
            {children}
        </PlayerContext.Provider>
    )
}

export function usePlayer() {
    const context = useContext(PlayerContext);
    if (context === undefined) throw new Error("usePlayerContext must be used within a PlayerContextProvider");
    return context;
}