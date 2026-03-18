import React, {useEffect, useState} from "react";
import {useWindow} from "../context/WindowContext";
import GridSoundboard from "../components/soundboard/grid/GridSoundboard";
import Player from "../components/player/Player";
import GridProfileSettings from "../components/soundboard/grid/GridProfileSettings";
import {usePlayer} from "../context/PlayerContext";
import Playlist from "../components/player/Playlist";
import BoardWin from "./BoardWin";

const MusicBoardWin = () => {
    const {settings} = useWindow();
    const {player} = usePlayer();
    const [profileSettingsOpen, setProfileSettingsOpen] = useState<boolean>(false);
    const [playlistOpen, setPlaylistOpen] = useState<boolean>(false);

    useEffect(() => {
        const unsubPlay = window.electron.player.onPlay(() => player.play());
        const unsubPause = window.electron.player.onPause(() => player.pause());
        const unsubStop = window.electron.player.onStop(() => player.stop());
        const unsubNext = window.electron.player.onNext(() => player.next());
        const unsubPrevious = window.electron.player.onPrevious(() => player.previous());

        return () => {
            unsubPlay();
            unsubPause();
            unsubStop();
            unsubNext();
            unsubPrevious();
        };
    }, []);

    useEffect(() => {
        if (settings && settings.music && settings.music.repeat) player.setRepeatMode(settings.music.repeat);
    }, [settings]);

    return (
        <BoardWin>
            <GridSoundboard gridHeight={'calc(100vh - var(--titlebar-height) - var(--player-height) - 10px)'}/>
            <Player
                showProfileSettings={() => setProfileSettingsOpen(true)}
                showPlaylist={() => setPlaylistOpen(true)}
            />

            <GridProfileSettings
                show={profileSettingsOpen}
                onClose={() => setProfileSettingsOpen(false)}
                mb={'calc(var(--player-height) + 10px)'}
            />

            <Playlist
                show={playlistOpen}
                onClose={() => setPlaylistOpen(false)}
            />
        </BoardWin>
    )
}

export default MusicBoardWin;