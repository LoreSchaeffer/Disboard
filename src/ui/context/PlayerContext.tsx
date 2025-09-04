import {Player, PlayerStatus} from "../utils/player";
import {createContext, PropsWithChildren, useContext, useEffect, useRef, useState} from "react";
import {Track} from "../../types/track";
import {RepeatMode} from "../../types/types";
import {Time} from "../utils/time";

type PlayerContextType = {
    player: Player;
    previewPlayer: Player;
    status: PlayerStatus;
    repeat: RepeatMode;
    queue: Track[];
    index: number;
    currentTrack: Track | null;
    duration: Time | null;
    currentTime: number;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export default function PlayerContextProvider({children}: PropsWithChildren) {
    const [status, setStatus] = useState<PlayerStatus>();
    const [repeat, setRepeat] = useState<RepeatMode>();
    const [queue, setQueue] = useState<Track[]>([]);
    const [index, setIndex] = useState<number>(0);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [duration, setDuration] = useState<Time | null>(null);
    const [currentTime, setCurrentTime] = useState<number>(0);

    const playerRef = useRef<Player>(new Player());
    const previewPlayerRef = useRef<Player>(new Player());

    useEffect(() => {
        if (!playerRef.current) return;

        const player = playerRef.current;

        player.on('abort', () => {
            setStatus(player.getStatus());
            setCurrentTrack(player.getCurrentTrack());
            setDuration(null);
            setCurrentTime(0);
        });

        player.on('ended', () => {
            setStatus(player.getStatus());
            setCurrentTrack(player.getCurrentTrack());
            setDuration(null);
            setCurrentTime(0);
            setIndex(player.getIndex());
        });

        player.on('error', () => {
            setStatus(player.getStatus());
            setCurrentTrack(player.getCurrentTrack());
            setDuration(null);
            setCurrentTime(0);
        });

        player.on('pause', () => {
            setStatus(player.getStatus());
        });

        player.on('resume', () => {
            setStatus(player.getStatus());
        });

        player.on('play', (duration: Time) => {
            setStatus(player.getStatus());
            setCurrentTrack(player.getCurrentTrack());
            setDuration(duration);
            setIndex(player.getIndex());
        });

        player.on('timeupdate', (currentTime: number) => {
            setCurrentTime(currentTime);
        });

        player.on('repeatupdate', (mode: RepeatMode) => {
            setRepeat(mode);
        });

        player.on('queueupdate', (queue: Track[]) => {
            setQueue(queue);
        });

        player.on('reset', () => {
            setStatus(player.getStatus());
            setCurrentTrack(player.getCurrentTrack());
            setDuration(null);
            setCurrentTime(0);
            setIndex(player.getIndex());
            setQueue(player.getQueue());
        })

        return () => {
            player.off('abort');
            player.off('ended');
            player.off('error');
            player.off('pause');
            player.off('resume');
            player.off('play');
            player.off('seeked');
            player.off('timeupdate');
            player.off('repeatupdate');
            player.off('queueupdate');
            player.off('reset');
        }
    }, [playerRef]);

    return (
        <PlayerContext.Provider value={{
            player: playerRef.current,
            previewPlayer: previewPlayerRef.current,
            status: status,
            repeat: repeat,
            queue,
            index,
            currentTrack,
            duration,
            currentTime
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