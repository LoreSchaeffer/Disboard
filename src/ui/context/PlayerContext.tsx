import {Player, PlayerStatus} from "../utils/player";
import {createContext, PropsWithChildren, useContext, useEffect, useState} from "react";
import {Track} from "../../types/track";
import {Time} from "../utils/time";
import {RepeatMode} from "../../types/common";

type PlayerContextType = {
    player: Player;
    previewPlayer: Player;

    status: PlayerStatus;
    repeat: RepeatMode;
    queue: Track[];
    index: number;
    currentTrack: Track | null;
    duration: Time;
    currentTime: Time;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({children}: PropsWithChildren) => {
    const [player] = useState<Player>(() => new Player());
    const [previewPlayer] = useState<Player>(() => new Player());

    const [status, setStatus] = useState<PlayerStatus>(player.getStatus());
    const [repeat, setRepeat] = useState<RepeatMode>(player.getRepeatMode());
    const [queue, setQueue] = useState<Track[]>(player.getQueue());
    const [index, setIndex] = useState<number>(0);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(player.getCurrentTrack());

    const [duration, setDuration] = useState<Time>(new Time(0, 'ms'));
    const [currentTime, setCurrentTime] = useState<Time>(new Time(0, 'ms'));

    useEffect(() => {
        const syncState = () => {
            setStatus(player.getStatus());
            setRepeat(player.getRepeatMode());
            setQueue(player.getQueue());
            setIndex(player.getIndex());
            setCurrentTrack(player.getCurrentTrack());

            const dur = player.getDuration();
            setDuration(dur ? dur : new Time(0, 'ms'));
        };

        const handleTimeUpdate = (time: Time, dur: Time) => {
            setCurrentTime(time);
            if (dur) setDuration(dur);
        };

        player.on('play', syncState);
        player.on('pause', syncState);
        player.on('resume', syncState);
        player.on('loading', (isLoading) => setStatus(prev => ({...prev, loading: isLoading})));

        player.on('ended', () => {
            syncState();
            setCurrentTime(new Time(0, 'ms'));
        });

        player.on('timeupdate', handleTimeUpdate);

        player.on('trackchange', (track) => {
            setCurrentTrack(track);
            setCurrentTime(new Time(0, 'ms'));
            setDuration(new Time(0, 'ms'));
        });

        player.on('queueupdate', (newQueue) => setQueue(newQueue));
        player.on('repeatupdate', (mode) => setRepeat(mode));

        player.on('error', () => {
            syncState();
            setCurrentTime(new Time(0, 'ms'));
        });

        player.on('reset', () => {
            syncState();
            setCurrentTime(new Time(0, 'ms'));
            setDuration(new Time(0, 'ms'));
        });

        return () => {
            player.off('play');
            player.off('pause');
            player.off('resume');
            player.off('loading');
            player.off('ended');
            player.off('timeupdate');
            player.off('trackchange');
            player.off('queueupdate');
            player.off('repeatupdate');
            player.off('error');
            player.off('reset');
        }
    }, [player]);

    return (
        <PlayerContext.Provider value={{
            player,
            previewPlayer,
            status,
            repeat,
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
    if (context === undefined) throw new Error("usePlayer must be used within a PlayerContextProvider");
    return context;
}