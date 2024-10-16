import './Soundboard.css';

import {useData} from "../../ui/windowContext";
import SoundboardButton from "./SoundboardButton";
import {SbButton} from "../../utils/store/profiles";
import {ContextMenuProps} from "../context/ContextMenu";
import React from "react";
import {MenuItemProps} from "../context/MenuItem";
import {usePlayer} from "../../ui/playerContext";

const Soundboard = () => {
    const {winId, activeProfile, mainPlayer, setContextMenu, copiedButton, setCopiedButton, copiedStyle, setCopiedStyle} = useData();
    const {setQueue} = usePlayer();

    const rows = activeProfile?.rows || 8;
    const cols = activeProfile?.cols || 10;
    const buttons = [];

    const handleClick = (e: React.MouseEvent, btn: SbButton) => {
        if (btn == null) return;
        const song = btn.song;
        if (song == null) return;

        mainPlayer.playNow(song);
    }

    const handleContextMenu = (e: React.MouseEvent, btn: SbButton, row: number, col: number) => {
        e.preventDefault();

        const playNow = () => {
            if (btn == null) return;
            const song = btn.song;
            if (song == null) return;

            mainPlayer.playNow(song);
        }

        const addToQueue = () => {
            if (btn == null) return;
            const song = btn.song;
            if (song == null) return;

            setQueue((prev) => [...prev, song]);
        }

        const copyButton = () => {
            if (btn == null || btn.song == null) return;
            setCopiedButton(btn);
        }

        const pasteButton = () => {
            const tmpRow = row;
            const tmpCol = col;
            btn = copiedButton;
            btn.row = tmpRow;
            btn.col = tmpCol;
            (window as any).electron.saveButton(activeProfile.id, btn);
        }

        const copyStyle = () => {
            if (btn == null) return;
            if (btn.style === undefined) setCopiedStyle(null);
            else setCopiedStyle(btn.style);
        }

        const pasteStyle = () => {
            btn.style = copiedStyle;
            (window as any).electron.saveButton(activeProfile.id, btn);
        }

        const clearButton = () => {
            const index = activeProfile.buttons.findIndex(b => b.row === row && b.col === col);
            if (index !== -1) {
                activeProfile.buttons.splice(index, 1);
                (window as any).electron.saveProfile(activeProfile);
            }
        }

        const contextMenu = [
            {
                text: 'Play now',
                icon: 'play',
                onClick: () => playNow()
            } as MenuItemProps,
            {
                text: 'Add to queue',
                icon: 'add_to_queue',
                onClick: () => addToQueue()
            } as MenuItemProps,
            {
                type: 'separator'
            } as MenuItemProps,
            {
                text: 'Chose file',
                icon: 'publish',
                onClick: () => (window as any).electron.openMediaSelectorWin(row, col, winId)
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
                onClick: () => copyButton(),
            } as MenuItemProps,
            {
                text: 'Paste button',
                icon: 'paste',
                onClick: () => pasteButton(),
                disabled: copiedButton === undefined
            } as MenuItemProps,
            {
                type: 'separator'
            },
            {
                text: 'Copy style',
                icon: 'copy',
                onClick: () => copyStyle(),
            } as MenuItemProps,
            {
                text: 'Paste style',
                icon: 'paste',
                disabled: copiedStyle === undefined,
                onClick: () => pasteStyle(),
            } as MenuItemProps,
            {
                type: 'separator'
            } as MenuItemProps,
            {
                text: 'Clear',
                icon: 'delete',
                type: 'danger',
                onClick: () => clearButton()
            } as MenuItemProps
        ];

        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: contextMenu
        } as ContextMenuProps);
    }

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            buttons.push(<SoundboardButton
                key={`btn-${row}-${col}`}
                row={row}
                col={col}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
            />);
        }
    }

    return (
        <div className="soundboard" style={{
            gridTemplateRows: `repeat(${rows}, 1fr)`,
            gridTemplateColumns: `repeat(${cols}, 1fr)`
        }}>
            {buttons}
        </div>
    );
}

export default Soundboard;