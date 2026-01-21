import {Player, PlayerStatus} from "../utils/player";
import {createContext, PropsWithChildren, useContext, useEffect, useState} from "react";
import {Time} from "../utils/time";
import {RepeatMode} from "../../types/common";
import {PlayerTrack} from "../../types/data";

type PlayerContextType = {
    player: Player;
    status: PlayerStatus;
    repeat: RepeatMode;
    queue: PlayerTrack[];
    index: number;
    currentTrack: PlayerTrack | null;
    duration: Time;
    currentTime: Time;

    previewPlayer: Player;
    previewStatus: PlayerStatus;
    previewCurrentTrack: PlayerTrack | null;
    previewDuration: Time;
    previewCurrentTime: Time;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({children}: PropsWithChildren) => {
    const [player] = useState<Player>(() => new Player());
    const [previewPlayer] = useState<Player>(() => new Player());

    const [status, setStatus] = useState<PlayerStatus>(player.getStatus());
    const [repeat, setRepeat] = useState<RepeatMode>(player.getRepeatMode());
    const [queue, setQueue] = useState<PlayerTrack[]>(player.getQueue());
    const [index, setIndex] = useState<number>(0);
    const [currentPlayerTrack, setCurrentPlayerTrack] = useState<PlayerTrack | null>(player.getCurrentPlayerTrack());
    const [duration, setDuration] = useState<Time>(new Time(0, 'ms'));
    const [currentTime, setCurrentTime] = useState<Time>(new Time(0, 'ms'));

    const [previewStatus, setPreviewStatus] = useState<PlayerStatus>(previewPlayer.getStatus());
    const [previewCurrentPlayerTrack, setPreviewCurrentPlayerTrack] = useState<PlayerTrack | null>(previewPlayer.getCurrentPlayerTrack());
    const [previewDuration, setPreviewDuration] = useState<Time>(new Time(0, 'ms'));
    const [previewCurrentTime, setPreviewCurrentTime] = useState<Time>(new Time(0, 'ms'));

    useEffect(() => {
        const syncState = () => {
            setStatus(player.getStatus());
            setRepeat(player.getRepeatMode());
            setQueue(player.getQueue());
            setIndex(player.getIndex());
            setCurrentPlayerTrack(player.getCurrentPlayerTrack());

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
            setCurrentPlayerTrack(track);
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

    useEffect(() => {
        const syncPreviewState = () => {
            setPreviewStatus(previewPlayer.getStatus());
            setPreviewCurrentPlayerTrack(previewPlayer.getCurrentPlayerTrack());

            const dur = previewPlayer.getDuration();
            setPreviewDuration(dur ? dur : new Time(0, 'ms'));
        };

        const handlePreviewTimeUpdate = (time: Time, dur: Time) => {
            setPreviewCurrentTime(time);
            if (dur) setPreviewDuration(dur);
        };

        previewPlayer.on('play', syncPreviewState);
        previewPlayer.on('pause', syncPreviewState);
        previewPlayer.on('resume', syncPreviewState);
        previewPlayer.on('loading', (isLoading) => setPreviewStatus(prev => ({...prev, loading: isLoading})));

        previewPlayer.on('ended', () => {
            syncPreviewState();
            setPreviewCurrentTime(new Time(0, 'ms'));
        });

        previewPlayer.on('timeupdate', handlePreviewTimeUpdate);

        previewPlayer.on('trackchange', (track) => {
            setPreviewCurrentPlayerTrack(track);
            setPreviewCurrentTime(new Time(0, 'ms'));
            setPreviewDuration(new Time(0, 'ms'));
        });

        previewPlayer.on('error', () => {
            syncPreviewState();
            setPreviewCurrentTime(new Time(0, 'ms'));
        });

        previewPlayer.on('reset', () => {
            syncPreviewState();
            setPreviewCurrentTime(new Time(0, 'ms'));
            setPreviewDuration(new Time(0, 'ms'));
        });

        return () => {
            previewPlayer.off('play');
            previewPlayer.off('pause');
            previewPlayer.off('resume');
            previewPlayer.off('loading');
            previewPlayer.off('ended');
            previewPlayer.off('timeupdate');
            previewPlayer.off('trackchange');
            previewPlayer.off('error');
            previewPlayer.off('reset');
        };
    }, [previewPlayer]);

    return (
        <PlayerContext.Provider value={{
            player,
            status,
            repeat,
            queue,
            index,
            currentTrack: currentPlayerTrack,
            duration,
            currentTime,

            previewPlayer,
            previewStatus,
            previewCurrentTrack: previewCurrentPlayerTrack,
            previewDuration,
            previewCurrentTime
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