import './SoundboardButton.css';
import {useData} from '../../ui/context';
import React from "react";
import {ContextMenuProps} from "../context/ContextMenu";
import {MenuItemProps} from "../context/MenuItem";
import {getButton} from "../../ui/utils";

const contextMenu = [
    {
        text: 'Play now',
        icon: 'play',
        onClick: () => console.log('Play now')
    } as MenuItemProps,
    {
        text: 'Add to queue',
        icon: 'add_to_queue',
        onClick: () => console.log('Add to queue')
    } as MenuItemProps,
    {
        type: 'separator'
    } as MenuItemProps,
    {
        text: 'Chose file',
        icon: 'publish',
        onClick: () => console.log('Chose file')
    } as MenuItemProps,
    {
        text: 'Settings',
        icon: 'settings',
        onClick: () => console.log('Settings')
    } as MenuItemProps,
    {
        type: 'separator'
    } as MenuItemProps,
    {
        text: 'Copy button',
        icon: 'copy',
        onClick: () => console.log('Copy button')
    } as MenuItemProps,
    {
        text: 'Paste button',
        icon: 'paste',
        onClick: () => console.log('Paste button'),
        disabled: true
    } as MenuItemProps,
    {
        type: 'separator'
    },
    {
        text: 'Copy style',
        icon: 'copy',
    } as MenuItemProps,
    {
        text: 'Paste style',
        icon: 'paste',
        disabled: true
    } as MenuItemProps,
    {
        type: 'separator'
    } as MenuItemProps,
    {
        text: 'Clear',
        icon: 'delete',
        type: 'danger',
        onClick: () => console.log('Delete button')
    } as MenuItemProps
];

interface SoundboardButtonProps {
    row: number;
    col: number;
}

const SoundboardButton = ({row, col}: SoundboardButtonProps) => {
    const {settings, setContextMenu, activeProfile, player} = useData();

    const button = getButton(activeProfile, row, col);

    let thumbnail = 'url(images/track.png)';
    if (button) {
        if (button.song.thumbnail) thumbnail = `url(${button.song.thumbnail})`;
    }

    let image = null;
    if (settings.show_images) image = <div className={"sb-btn-img"} style={{backgroundImage: thumbnail}}></div>;

    const onClick = () => {
        if (button == null) return;
        const song = button.song;
        if (song == null) return;

        player.playNow(song);
    };

    const onContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: contextMenu
        } as ContextMenuProps);
    };

    return (
        <div id={`btn-${row}-${col}`} className={"sb-btn"} data-row={row} data-col={col} style={{justifyContent: image == null ? 'center' : 'flex-start'}} onClick={onClick} onContextMenu={onContextMenu}>
            {settings.show_images && image}
            <span className={"sb-btn-title"}>Button {row}.{col}</span>
        </div>
    );
}

export default SoundboardButton;