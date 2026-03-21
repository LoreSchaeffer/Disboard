import styles from "./GridSoundboard.module.css";
import React, {MouseEvent, useCallback, useEffect, useMemo, useState} from "react";
import {DndProvider} from 'react-dnd';
import {HTML5Backend} from 'react-dnd-html5-backend';
import DraggableGridButton from "./DraggableGridButton";
import {useShortcut, useWindow} from "../../../context/WindowContext";
import {usePlayer} from "../../../context/PlayerContext";
import {useContextMenu} from "../../../context/ContextMenuContext";
import {ContextMenuItemData} from "../../context_menu/ContextMenuItem";
import {PiBroomBold, PiCopyBold, PiFileBold, PiGearSixBold, PiPlayFill, PiPlaylistBold, PiStopBold, PiStopFill, PiTrashBold} from "react-icons/pi";
import {FaRegPaste} from "react-icons/fa6";
import {playerTrackFromBtn} from "../../../utils/utils";
import {useNavigation} from "../../../context/NavigationContext";
import {useProfiles} from "../../../context/ProfilesProvider";
import {BoardType, BtnStyle, GridBtnSettingsWin, SbGridBtn} from "../../../../types";
import SearchBar from "../SearchBar";

type GridSoundboardProps = {
    gridHeight?: string;
}

const GridSoundboard = ({gridHeight = 'calc(100vh - var(--titlebar-height) - 1px)',}: GridSoundboardProps) => {
    const {settings} = useWindow();
    const {boardType, activeGridProfile} = useProfiles();
    const {showContextMenu} = useContextMenu();
    const {player, previewPlayer, activeSfx} = usePlayer();
    const {navigate} = useNavigation();

    const [copiedButton, setCopiedButton] = useState<SbGridBtn | null>(null);
    const [copiedStyle, setCopiedStyle] = useState<BtnStyle | null>(null);
    const [showSearchBar, setShowSearchBar] = useState<boolean>(true);
    const [searchBarPos, setSearchBarPos] = useState<{ x: 'left' | 'right', y: 'top' | 'bottom' }>({x: 'right', y: 'top'});
    const [searchQuery, setSeachQuery] = useState<string | null>(null);

    const rows = activeGridProfile?.rows || 8;
    const cols = activeGridProfile?.cols || 10;

    const buttonMap = useMemo(() => {
        const map = new Map<string, SbGridBtn>();
        if (!activeGridProfile?.buttons) return map;

        for (const btn of activeGridProfile.buttons) {
            map.set(`${btn.row}-${btn.col}`, btn);
        }
        return map;
    }, [activeGridProfile?.buttons]);

    useEffect(() => {
        if (!searchQuery || searchQuery.trim() === '') return;

        const query = searchQuery.toLowerCase();

        const quadrants = {
            'top-left': 0,
            'top-right': 0,
            'bottom-left': 0,
            'bottom-right': 0,
        };

        const halfRows = rows / 2;
        const halfCols = cols / 2;

        let hasMatches = false;

        buttonMap.forEach((btn) => {
            if (btn.track) {
                const title = (btn.title || btn.track.title || '').toLowerCase();
                if (title.includes(query)) {
                    hasMatches = true;
                    const isTop = btn.row < halfRows;
                    const isLeft = btn.col < halfCols;

                    if (isTop && isLeft) quadrants['top-left']++;
                    else if (isTop && !isLeft) quadrants['top-right']++;
                    else if (!isTop && isLeft) quadrants['bottom-left']++;
                    else if (!isTop && !isLeft) quadrants['bottom-right']++;
                }
            }
        });

        if (!hasMatches) return;

        const currentQuadKey = `${searchBarPos.y}-${searchBarPos.x}`;

        if (quadrants[currentQuadKey as keyof typeof quadrants] > 0) {
            let bestQuad = currentQuadKey;
            let minMatches = quadrants[currentQuadKey as keyof typeof quadrants];

            for (const [quad, count] of Object.entries(quadrants)) {
                if (count < minMatches) {
                    minMatches = count;
                    bestQuad = quad;
                }
            }

            if (bestQuad !== currentQuadKey) {
                const [y, x] = bestQuad.split('-');
                setSearchBarPos({y: y as 'top' | 'bottom', x: x as 'left' | 'right'});
            }
        }
    }, [searchQuery, buttonMap, rows, cols, searchBarPos]);

    useEffect(() => {
        const unsubPlay = window.electron.player.onPlayButton(buttonId => {
            const button = activeGridProfile?.buttons.find(b => b.id === buttonId);
            if (!button) return;
            onClick(null, button);
        });

        const unsubStop = window.electron.player.onStopButton(buttonId => player.stopSfx(buttonId));

        return () => {
            unsubPlay();
            unsubStop();
        }
    }, [activeGridProfile]);

    if (!activeGridProfile) return null;

    const onClick = (_: MouseEvent, button: SbGridBtn) => {
        if (!button || !button.track) return

        if (boardType === 'sfx') {
            player.toggleSfx(button.id, button.loop ?? false, playerTrackFromBtn(button));
        } else {
            player.playNow(playerTrackFromBtn(button));
        }
    }

    const clearButton = (btn: SbGridBtn) => {
        window.electron.gridProfiles.buttons.delete(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, btn.id);
        if (player.getCurrentTrack()?.id === btn.track.id) player.stop();
        if (previewPlayer.getCurrentTrack()?.id === btn.track.id) previewPlayer.stop();
    }

    const onContextMenu = useCallback((event: MouseEvent, targetButton: SbGridBtn, row: number, col: number) => {
        const btn = targetButton || {id: '', row, col};
        const isButtonNotSet = !btn.track && btn;

        const getItems = (): ContextMenuItemData[] => {
            const items: ContextMenuItemData[] = [];

            if (!isButtonNotSet) {
                if (boardType === 'sfx') {
                    const isSfxPlaying = btn.id ? activeSfx[btn.id]?.playing : false;

                    items.push({
                        label: isSfxPlaying ? 'Stop SFX' : 'Play Now',
                        icon: isSfxPlaying ? <PiStopFill/> : <PiPlayFill/>,
                        onClick: () => player.toggleSfx(btn.id, btn.loop ?? false, playerTrackFromBtn(btn))
                    });
                } else {
                    items.push(
                        {
                            label: 'Play Now',
                            icon: <PiPlayFill/>,
                            onClick: () => player.playNow(playerTrackFromBtn(btn))
                        },
                        {
                            label: 'Add to playlist',
                            icon: <PiPlaylistBold/>,
                            onClick: () => player.addToQueue(playerTrackFromBtn(btn))
                        }
                    );
                }
            }

            const isPreviewing = previewPlayer.getState().playing;
            if (!isButtonNotSet) {
                items.push({
                    label: isPreviewing ? 'Stop Preview' : 'Preview',
                    icon: isPreviewing ? <PiStopFill/> : <PiPlayFill/>,
                    onClick: () => isPreviewing ? previewPlayer.stop() : previewPlayer.playNow(playerTrackFromBtn(btn))
                });
            } else if (isPreviewing) {
                items.push({
                    label: 'Stop Preview',
                    icon: <PiStopBold/>,
                    onClick: () => previewPlayer.stop()
                });
            }

            if (items.length > 0) items.push({separator: true});

            items.push({
                label: 'Choose track',
                icon: <PiFileBold/>,
                onClick: () => window.electron.window.open('grid_media_selector', {
                    boardType: boardType as Exclude<BoardType, 'ambient'>,
                    action: 'update_button',
                    profileId: activeGridProfile.id,
                    gridPos: {row: btn.row, col: btn.col},
                })
            });

            if (!isButtonNotSet) {
                items.push(
                    {
                        label: 'Settings',
                        icon: <PiGearSixBold/>,
                        onClick: () => window.electron.window.open('grid_btn_settings', {
                            boardType: boardType,
                            profileId: activeGridProfile.id,
                            buttonId: btn.id
                        } as GridBtnSettingsWin)
                    },
                    {separator: true},
                    {
                        label: 'Copy button',
                        icon: <PiCopyBold/>,
                        onClick: () => setCopiedButton({...btn})
                    }
                );
            }

            if (copiedButton) {
                items.push(
                    {separator: !isButtonNotSet},
                    {
                        label: 'Paste button',
                        icon: <FaRegPaste/>,
                        onClick: () => {
                            window.electron.gridProfiles.buttons.update(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, btn.id, {
                                row: btn.row,
                                col: btn.col,
                                track: copiedButton.track?.id
                            });
                        }
                    }
                );
            }

            if (!isButtonNotSet) {
                items.push(
                    {separator: true},
                    {
                        label: 'Copy style',
                        icon: <PiCopyBold/>,
                        onClick: () => {
                            if (btn.style) setCopiedStyle({...btn.style});
                        },
                        disabled: !btn.style
                    },
                    {
                        label: 'Paste style',
                        icon: <FaRegPaste/>,
                        onClick: () => window.electron.gridProfiles.buttons.update(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, btn.id, {style: {...copiedStyle}}),
                        disabled: !copiedStyle
                    },
                    {
                        label: 'Clear style',
                        icon: <PiBroomBold/>,
                        onClick: () => window.electron.gridProfiles.buttons.update(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, btn.id, {style: null}),
                        disabled: !btn.style
                    },
                    {separator: true},
                    {
                        label: 'Clear',
                        icon: <PiTrashBold/>,
                        variant: 'danger',
                        onClick: () => {
                            if (settings && !settings.confirmButtonDeletion) {
                                clearButton(btn);
                            } else {
                                navigate('delete_confirmation', {
                                    replace: false,
                                    data: {
                                        boardType: boardType,
                                        resource: 'button',
                                        id: btn.id,
                                        onConfirm: () => clearButton(btn)
                                    }
                                });
                            }
                        }
                    }
                );
            }

            return items;
        }

        showContextMenu({items: getItems(), event});
    }, [activeGridProfile?.id, boardType, copiedButton, copiedStyle, navigate, player, previewPlayer, settings, showContextMenu, activeSfx]);

    const swapButtons = useCallback((fromRow: number, fromCol: number, toRow: number, toCol: number) => {
        const fromButton = buttonMap.get(`${fromRow}-${fromCol}`);
        const toButton = buttonMap.get(`${toRow}-${toCol}`);

        if (!fromButton && !toButton) return;

        window.electron.gridProfiles.buttons.swap(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, {row: fromRow, col: fromCol}, {row: toRow, col: toCol});
    }, [activeGridProfile?.id, boardType, buttonMap]);

    const closeSearchBar = () => {
        setSeachQuery(null);
        setShowSearchBar(false);
        setSearchBarPos({x: 'right', y: 'top'});
    }

    useShortcut('ctrl+f', () => {
        if (showSearchBar) closeSearchBar();
        else setShowSearchBar(true);
    });

    return (
        <>
            <SearchBar
                show={showSearchBar}
                position={searchBarPos}
                onClose={closeSearchBar}
                onChange={(val) => setSeachQuery(val)}
            />
            <DndProvider backend={HTML5Backend}>
                <div
                    className={styles.soundboard}
                    style={{
                        gridTemplateRows: `repeat(${rows}, 1fr)`,
                        gridTemplateColumns: `repeat(${cols}, 1fr)`,
                        height: gridHeight
                    }}
                >
                    {Array.from({length: rows}).map((_, row) =>
                        Array.from({length: cols}).map((_, col) => {
                            const button = buttonMap.get(`${row}-${col}`);
                            const hasTrack = button && !!button.track;
                            const isDownloading = hasTrack && button.track.downloading;

                            const currentSfxState = button ? activeSfx[button.id] : undefined;
                            const isActive = currentSfxState?.playing || false;
                            const progress = currentSfxState?.progress || 0;

                            let isSearchMatch = false;
                            if (showSearchBar && searchQuery && searchQuery.trim() !== '' && button && button.track) {
                                const title = (button.title || button.track.title || '').toLowerCase();
                                isSearchMatch = title.includes(searchQuery.toLowerCase());
                            }

                            return (
                                <DraggableGridButton
                                    key={`btn-${row}-${col}`}
                                    row={row}
                                    col={col}
                                    button={button || undefined}
                                    searchMatch={isSearchMatch}
                                    onClick={hasTrack && !isDownloading ? onClick : undefined}
                                    onContextMenu={!isDownloading || !hasTrack ? onContextMenu : undefined}
                                    swapButtons={swapButtons}
                                    zoom={settings?.[boardType].zoom ?? 1}
                                    showImages={settings?.showImages ?? true}
                                    active={isActive}
                                    progress={progress}
                                />
                            );
                        })
                    )}
                </div>
            </DndProvider>
        </>
    );
}

export default GridSoundboard;