import {Player} from "../utils/player";
import {createContext, PropsWithChildren, useContext, useRef} from "react";

type PlayerContextType = {
    player: Player;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export default function PlayerContextProvider({children}: PropsWithChildren) {
    const playerRef = useRef<Player>(new Player());

    return (
        <PlayerContext.Provider value={{
            player: playerRef.current
        }}>
            {children}
        </PlayerContext.Provider>
    )
}

export function usePlayerContext() {
    const context = useContext(PlayerContext);
    if (context === undefined) throw new Error("usePlayerContext must be used within a PlayerContextProvider");
    return context;
}