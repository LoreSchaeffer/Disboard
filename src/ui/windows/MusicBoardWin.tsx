import React, {useEffect, useState} from "react";
import {useWindow} from "../context/WindowContext";
import GridSoundboard from "../components/soundboard/grid/GridSoundboard";
import Player from "../components/player/Player";
import GridProfileSettings from "../components/soundboard/grid/GridProfileSettings";
import {usePlayer} from "../context/PlayerContext";
import Playlist from "../components/player/Playlist";
import BoardWin from "./BoardWin";
import AvailablePlaylists from "../components/player/AvailablePlaylists";

const MusicBoardWin = () => {
    const {settings} = useWindow();
    const {player} = usePlayer();
    const [profileSettingsOpen, setProfileSettingsOpen] = useState<boolean>(false);
    const [playlistOpen, setPlaylistOpen] = useState<boolean>(false);
    const [availablePlaylistsOpen, setAvailablePlaylistsOpen] = useState<boolean>(false);

    useEffect(() => {
        const unsubPlay = window.electron.player.onPlay(() => player.play());
        const unsubPause = window.electron.player.onPause(() => player.pause());
        const unsubPlayPause = window.electron.player.onPlayPause(() => player.playPause());
        const unsubStop = window.electron.player.onStop(() => player.stop());
        const unsubNext = window.electron.player.onNext(() => player.next());
        const unsubPrevious = window.electron.player.onPrevious(() => player.previous());
        const unsubSeek = window.electron.player.onSeek((time) => player.seek(time));
        const unsubVolume = window.electron.player.onVolumeChange((volume) => player.setVolume(volume));
        const unsubRepeatMode = window.electron.player.onRepeatModeChange((mode) => {
            player.setRepeatMode(mode);
            window.electron.settings.set({music: {repeat: mode}});
        });

        return () => {
            unsubPlay();
            unsubPause();
            unsubPlayPause();
            unsubStop();
            unsubNext();
            unsubPrevious();
            unsubSeek();
            unsubVolume();
            unsubRepeatMode();
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
                showAvailablePlaylists={() => setAvailablePlaylistsOpen(true)}
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

            <AvailablePlaylists
                show={availablePlaylistsOpen}
                onClose={() => setAvailablePlaylistsOpen(false)}
            />
        </BoardWin>
    )
}

export default MusicBoardWin;