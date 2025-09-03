import styles from "./Soundboard.module.css";
import React, {useState} from "react";
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import DraggableButton from "./DraggableButton";
import {useWindowContext} from "../../context/WindowContext";

const Soundboard = () => {
    const {activeProfile, setContextMenu} = useWindowContext();

    const rows = activeProfile?.rows || 8;
    const cols = activeProfile?.cols || 10;

    // const handleClick = (e: React.MouseEvent, btn: SbButton) => {
    //     if (btn == null) return;
    //     const song = btn.song;
    //     if (song == null) return;
    //     song.title = btn.title;
    //
    //     mainPlayer.playNow(song);
    // }
    //
    // const handleContextMenu = (e: React.MouseEvent, btn: SbButton, row: number, col: number) => {
    //     e.preventDefault();
    //
    //     const preview = () => {
    //         if (btn == null) return;
    //         const song = btn.song;
    //         if (song == null) return;
    //         song.title = btn.title;
    //
    //         previewPlayer.playNow(song);
    //         setPreviewPlaying(true);
    //     }
    //
    //     const pausePreview = () => {
    //         previewPlayer.stop();
    //         setPreviewPlaying(false);
    //     }
    //
    //     const addToQueue = () => {
    //         if (btn == null) return;
    //         const song = btn.song;
    //         if (song == null) return;
    //         song.title = btn.title;
    //
    //         setQueue((prev) => [...prev, song]);
    //     }
    //
    //     const copyButton = () => {
    //         if (btn == null || btn.song == null) return;
    //         setCopiedButton(btn);
    //     }
    //
    //     const pasteButton = () => {
    //         const tmpRow = row;
    //         const tmpCol = col;
    //         btn = copiedButton;
    //         btn.row = tmpRow;
    //         btn.col = tmpCol;
    //         (window as any).electron.saveButton(activeProfile.id, btn);
    //     }
    //
    //     const copyStyle = () => {
    //         if (btn == null) return;
    //         if (btn.style === undefined) setCopiedStyle(null);
    //         else setCopiedStyle(btn.style);
    //     }
    //
    //     const pasteStyle = () => {
    //         btn.style = copiedStyle;
    //         (window as any).electron.saveButton(activeProfile.id, btn);
    //     }
    //
    //     const clearButton = () => {
    //         const index = activeProfile.buttons.findIndex(b => b.row === row && b.col === col);
    //         if (index !== -1) {
    //             activeProfile.buttons.splice(index, 1);
    //             (window as any).electron.saveProfile(activeProfile);
    //         }
    //     }
    //
    //     const contextMenu = [
    //         {
    //             text: previewPlaying ? 'Pause Preview' : 'Preview',
    //             icon: previewPlaying ? 'pause' : 'play',
    //             onClick: () => previewPlaying ? pausePreview() : preview()
    //         } as MenuItemProps,
    //         {
    //             text: 'Add to queue',
    //             icon: 'add_to_queue',
    //             onClick: () => addToQueue()
    //         } as MenuItemProps,
    //         {
    //             type: 'separator'
    //         } as MenuItemProps,
    //         {
    //             text: 'Chose file',
    //             icon: 'publish',
    //             onClick: () => (window as any).electron.openMediaSelectorWin(row, col, winId)
    //         } as MenuItemProps,
    //         {
    //             text: 'Settings',
    //             icon: 'settings',
    //             onClick: () => (window as any).electron.openButtonSettingsWin(row, col)
    //         } as MenuItemProps,
    //         {
    //             type: 'separator'
    //         } as MenuItemProps,
    //         {
    //             text: 'Copy button',
    //             icon: 'copy',
    //             onClick: () => copyButton(),
    //         } as MenuItemProps,
    //         {
    //             text: 'Paste button',
    //             icon: 'paste',
    //             onClick: () => pasteButton(),
    //             disabled: copiedButton === undefined
    //         } as MenuItemProps,
    //         {
    //             type: 'separator'
    //         },
    //         {
    //             text: 'Copy style',
    //             icon: 'copy',
    //             onClick: () => copyStyle(),
    //         } as MenuItemProps,
    //         {
    //             text: 'Paste style',
    //             icon: 'paste',
    //             disabled: copiedStyle === undefined,
    //             onClick: () => pasteStyle(),
    //         } as MenuItemProps,
    //         {
    //             type: 'separator'
    //         } as MenuItemProps,
    //         {
    //             text: 'Clear',
    //             icon: 'delete',
    //             type: 'danger',
    //             onClick: () => clearButton()
    //         } as MenuItemProps
    //     ];
    //
    //     setContextMenu({
    //         x: e.clientX,
    //         y: e.clientY,
    //         items: contextMenu
    //     } as ContextMenuProps);
    // }
    //
    // const swapButtons = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    //     const fromButton = activeProfile.buttons.find(b => b.row === fromRow && b.col === fromCol);
    //     const toButton = activeProfile.buttons.find(b => b.row === toRow && b.col === toCol);
    //
    //     if (!fromButton && !toButton) return;
    //
    //     if (fromButton && toButton) {
    //         [fromButton.row, fromButton.col, toButton.row, toButton.col] = [toButton.row, toButton.col, fromButton.row, fromButton.col];
    //     } else if (fromButton && !toButton) {
    //         fromButton.row = toRow;
    //         fromButton.col = toCol;
    //     } else if (toButton && !fromButton) {
    //         toButton.row = fromRow;
    //         toButton.col = fromCol;
    //     }
    //
    //     (window as any).electron.saveProfile(activeProfile);
    // };

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
                                //onClick={handleClick}
                                //onContextMenu={handleContextMenu}
                                //swapButtons={swapButtons}
                            />
                        );
                    })
                )}
            </div>
        </DndProvider>
    );
}

export default Soundboard;