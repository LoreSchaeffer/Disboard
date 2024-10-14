import './SoundboardButton.css';
import {useData} from '../../ui/context';
import React from "react";
import {ContextMenuProps} from "../context/ContextMenu";
import {MenuItemProps} from "../context/MenuItem";
import {getButton} from "../../ui/utils";
import {SbButton} from "../../utils/store/profiles";

interface SoundboardButtonProps {
    row: number;
    col: number;
    button?: SbButton;
}

const SoundboardButton = ({row, col, button}: SoundboardButtonProps) => {
    const {settings, setContextMenu, activeProfile, player} = useData();

    const btn = button ? button : getButton(activeProfile, row, col);

    let thumbnail = 'url(images/track.png)';
    if (btn) {
        if (btn.song.thumbnail) thumbnail = `url(${btn.song.thumbnail})`;
    }

    let image = null;
    if (settings.show_images) image = <div className={"sb-btn-img"} style={{backgroundImage: thumbnail}}></div>;

    const onClick = () => {
        if (btn == null) return;
        const song = btn.song;
        if (song == null) return;

        player.playNow(song);
    };

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
            onClick: () => (window as any).electron.openButtonSettingsWin(row, col)
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

    const onContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: contextMenu
        } as ContextMenuProps);
    };

    const buttonStyle = {} as any;
    if (btn) {
        if (btn.background_color) buttonStyle['--button-background'] = btn.background_color;
        if (btn.background_color_hover) buttonStyle['--button-background-hover'] = btn.background_color_hover;
        if (btn.text_color) buttonStyle['--button-text'] = btn.text_color;
        if (btn.text_color_hover) buttonStyle['--button-text-hover'] = btn.text_color_hover;
        if (btn.border_color) buttonStyle['--button-border'] = btn.border_color;
        if (btn.border_color_hover) buttonStyle['--button-border-hover'] = btn.border_color_hover;
    }

    return (
        <div
            className={"sb-btn"}
            style={{justifyContent: image == null ? 'center' : 'flex-start', ...buttonStyle}}
            onClick={onClick} onContextMenu={onContextMenu}
        >
            {settings.show_images && image}
            <span className={"sb-btn-title"}>Button {row}.{col}</span>
        </div>
    );
}

export default SoundboardButton;