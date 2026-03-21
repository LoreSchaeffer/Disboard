import {Player, PlayerState, SfxState} from "../utils/player";
import {createContext, PropsWithChildren, useContext, useEffect, useState} from "react";
import {Time} from "../utils/time";
import {BoardType, PlayerTrack, RepeatMode} from "../../types";
import {useWindow} from "./WindowContext";

type PlayerContextType = {
    player: Player;
    status: PlayerState;
    repeat: RepeatMode;
    queue: PlayerTrack[];
    index: number;
    currentTrack: PlayerTrack | null;
    duration: Time;
    currentTime: Time;
    activeSfx: Record<string, SfxState>;

    previewPlayer: Player;
    previewStatus: PlayerState;
    previewCurrentTrack: PlayerTrack | null;
    previewDuration: Time;
    previewCurrentTime: Time;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({children}: PropsWithChildren) => {
    const {data} = useWindow();
    const [player] = useState<Player>(() => new Player());
    const [previewPlayer] = useState<Player>(() => new Player());

    const [state, setState] = useState<PlayerState>(player.getState());
    const [repeat, setRepeat] = useState<RepeatMode>(player.getRepeatMode());
    const [queue, setQueue] = useState<PlayerTrack[]>(player.getQueue());
    const [index, setIndex] = useState<number>(0);
    const [currentPlayerTrack, setCurrentPlayerTrack] = useState<PlayerTrack | null>(player.getCurrentTrack());
    const [duration, setDuration] = useState<Time>(new Time(0, 'ms'));
    const [currentTime, setCurrentTime] = useState<Time>(new Time(0, 'ms'));
    const [activeSfx, setActiveSfx] = useState<Record<string, SfxState>>({});

    const [previewStatus, setPreviewStatus] = useState<PlayerState>(previewPlayer.getState());
    const [previewCurrentPlayerTrack, setPreviewCurrentPlayerTrack] = useState<PlayerTrack | null>(previewPlayer.getCurrentTrack());
    const [previewDuration, setPreviewDuration] = useState<Time>(new Time(0, 'ms'));
    const [previewCurrentTime, setPreviewCurrentTime] = useState<Time>(new Time(0, 'ms'));

    useEffect(() => {
        const syncAndBroadcast = () => {
            setState(player.getState());
            setRepeat(player.getRepeatMode());
            setQueue(player.getQueue());
            setIndex(player.getIndex());
            setCurrentPlayerTrack(player.getCurrentTrack());

            const dur = player.getDuration();
            setDuration(dur ? dur : new Time(0, 'ms'));

            window.electron.remoteServer.broadcast('player:state', player.getFullState());
        };

        const handleTimeUpdate = (time: Time, duration: Time) => {
            setCurrentTime(time);
            if (duration) setDuration(duration);
            window.electron.remoteServer.broadcast('player:timeupdate', {currentTime: time.getTimeMs(), duration: duration ? duration.getTimeMs() : 0});
        };

        player.on('play', syncAndBroadcast);
        player.on('pause', syncAndBroadcast);
        player.on('resume', syncAndBroadcast);
        player.on('ended', () => {
            setCurrentTime(new Time(0, 'ms'));
            syncAndBroadcast();
        });
        player.on('trackchange', () => {
            setCurrentTime(new Time(0, 'ms'));
            setDuration(new Time(0, 'ms'));
            syncAndBroadcast();
        });
        player.on('error', () => {
            setCurrentTime(new Time(0, 'ms'));
            syncAndBroadcast();
        });
        player.on('reset', () => {
            setCurrentTime(new Time(0, 'ms'));
            setDuration(new Time(0, 'ms'));
            syncAndBroadcast();
        });

        player.on('loading', (isLoading) => {
            setState(prev => ({...prev, loading: isLoading}));
            syncAndBroadcast();
        });

        player.on('queueupdate', (newQueue) => {
            setQueue(newQueue);
            syncAndBroadcast();
        });

        player.on('repeatupdate', (mode) => {
            setRepeat(mode);
            syncAndBroadcast();
        });

        player.on('sfxupdate', (sfx) => {
            setActiveSfx(sfx);
            syncAndBroadcast();
        });

        player.on('timeupdate', handleTimeUpdate);

        const unsubStopped = window.electron.player.onPreviewStopped(() => {
            if (!previewPlayer) return;
            previewPlayer.stop();
        });

        const unsubPlayNow = window.electron.player.onPlayNow((boardType: BoardType, track: PlayerTrack) => {
            if (!data || data.boardType !== boardType) return;
            if (!player) return;
            player.playNow(track);
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
            player.off('sfxupdate');

            unsubStopped();
            unsubPlayNow();
        }
    }, [player]);

    useEffect(() => {
        const syncPreviewState = () => {
            setPreviewStatus(previewPlayer.getState());
            setPreviewCurrentPlayerTrack(previewPlayer.getCurrentTrack());

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
            status: state,
            repeat,
            queue,
            index,
            currentTrack: currentPlayerTrack,
            duration,
            currentTime,
            activeSfx,

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