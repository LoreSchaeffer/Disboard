import styles from "./Soundboard.module.css";
import React, {MouseEvent, useState} from "react";
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import DraggableButton from "./DraggableButton";
import {useWindow} from "../../context/WindowContext";
import {usePlayer} from "../../context/PlayerContext";
import {SbButton, SbButtonStyle} from "../../../types/storage";
import {ContextMenuItemProps} from "../menu/ContextMenuItem";

const Soundboard = () => {
    const {activeProfile, setContextMenu} = useWindow();
    const {player, previewPlayer} = usePlayer();

    const [copiedButton, setCopiedButton] = useState<SbButton | null>(null);
    const [copiedStyle, setCopiedStyle] = useState<SbButtonStyle | null>(null);

    const rows = activeProfile?.rows || 8;
    const cols = activeProfile?.cols || 10;

    const onClick = (_: MouseEvent, button: SbButton) => {
        if (!button || !button.track) return
        player.playNow({...button.track, title: button.title || button.track.title});
    }

    const onContextMenu = (e: MouseEvent, button: SbButton, row: number, col: number) => {
        const playPreview = () => {
            if (!button || !button.track) return;
            previewPlayer.playNow({...button.track, title: button.title || button.track.title});
        }

        const stopPreview = () => {
            if (!previewPlayer.getStatus().playing) return;
            previewPlayer.stop();
        }

        const copyButton = () => {
            if (!button || !button.track) return;
            setCopiedButton({...button});
        }

        const copyStyle = () => {
            if (!button || !button.style) return;
            setCopiedStyle({...button.style});
        }

        const pasteButton = () => {
            if (!copiedButton) return;

            window.electron.saveButton(activeProfile.id, {row: row, col: col, ...copiedButton});
        }

        const pasteStyle = () => {
            if (!copiedStyle) return;
            window.electron.saveButton(activeProfile.id, {...button, style: {...copiedStyle}});
        }

        const clearStyle = () => {
            window.electron.saveButton(activeProfile.id, {...button, style: undefined});
        }

        const deleteButton = () => {
            if (!button) return;
            window.electron.deleteButton(activeProfile.id, row, col);
        }
        
        const items: ContextMenuItemProps[] = [];

        items.push({
            text: 'Play Now',
            icon: 'play',
            onClick: () => player.playNow({...button.track, title: button.title || button.track.title}),
            disabled: !button || !button.track
        });

        items.push({
            text: 'Add to queue',
            icon: 'add_to_queue',
            onClick: () => player.addToQueue({...button.track, title: button.title || button.track.title}),
            disabled: !button || !button.track
        })

        if (button && button.track) {
            items.push({
                text: previewPlayer.getStatus().playing ? 'Stop Preview' : 'Preview',
                icon: previewPlayer.getStatus().playing ? 'stop' : 'preview',
                onClick: () => previewPlayer.getStatus().playing ? stopPreview() : playPreview()
            });
        } else if (previewPlayer.getStatus().playing) {
            items.push({
                text: 'Stop Preview',
                icon: 'stop',
                onClick: () => stopPreview()
            });
        }

        items.push({type: 'separator'});

        items.push({
            text: 'Chose file',
            icon: 'publish',
            onClick: () => window.electron.openMediaSelectorWin(row, col)
        });
        items.push({
            text: 'Settings',
            icon: 'settings',
            onClick: () => window.electron.openButtonSettingsWin(row, col)
        });

        items.push({type: 'separator'});

        items.push({
            text: 'Copy button',
            icon: 'copy',
            onClick: () => copyButton(),
            disabled: !button || !button.track
        });
        items.push({
            text: 'Paste button',
            icon: 'paste',
            onClick: () => pasteButton(),
            disabled: !copiedButton
        });
        
        items.push({type: 'separator'});
        
        items.push({
            text: 'Copy style',
            icon: 'copy',
            onClick: () => copyStyle(),
            disabled: !button || !button.style
        });
        items.push({
            text: 'Paste style',
            icon: 'paste',
            disabled: !copiedStyle,
            onClick: () => pasteStyle(),
        });
        items.push({
            text: 'Clear style',
            icon: 'close',
            onClick: () => clearStyle()
        })
        
        items.push({type: 'separator'});
        
        items.push({
            text: 'Clear',
            icon: 'delete',
            type: 'danger',
            onClick: () => deleteButton(),
            disabled: !button
        });
        
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            items: items
        });
    }

    const swapButtons = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
        const fromButton = activeProfile.buttons.find(b => b.row === fromRow && b.col === fromCol);
        const toButton = activeProfile.buttons.find(b => b.row === toRow && b.col === toCol);

        if (!fromButton && !toButton) return;

        if (fromButton && toButton) {
            [fromButton.row, fromButton.col, toButton.row, toButton.col] = [toButton.row, toButton.col, fromButton.row, fromButton.col];
        } else if (fromButton && !toButton) {
            fromButton.row = toRow;
            fromButton.col = toCol;
        } else if (toButton && !fromButton) {
            toButton.row = fromRow;
            toButton.col = fromCol;
        }

        window.electron.saveProfile(activeProfile);
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div
                className={styles.soundboard}
                style={{
                    gridTemplateRows: `repeat(${rows}, 1fr)`,
                    gridTemplateColumns: `repeat(${cols}, 1fr)`
                }}
            >
                {Array.from({length: rows}).map((_, row) =>
                    Array.from({length: cols}).map((_, col) => {
                        const button = activeProfile.buttons.find(b => b.row === row && b.col === col) || null;
                        return (
                            <DraggableButton
                                key={`btn-${row}-${col}`}
                                row={row}
                                col={col}
                                button={button || undefined}
                                onClick={onClick}
                                onContextMenu={onContextMenu}
                                swapButtons={swapButtons}
                            />
                        );
                    })
                )}
            </div>
        </DndProvider>
    );
}

export default Soundboard;