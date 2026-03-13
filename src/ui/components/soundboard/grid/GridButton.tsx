import styles from "./GridButton.module.css";
import React, {CSSProperties, forwardRef, useMemo} from "react";
import {clamp} from "../../../../shared/utils";
import {clsx} from "clsx";
import {BoardType, SbGridBtn} from "../../../../types";
import {useProfiles} from "../../../context/ProfilesProvider";
import {usePlayer} from "../../../context/PlayerContext";

type CustomCSSProperties = CSSProperties & {
    '--sb-bg'?: string;
    '--sb-bg-hover'?: string;
    '--sb-bg-active'?: string;

    '--sb-text'?: string;
    '--sb-text-hover'?: string;
    '--sb-text-active'?: string;

    '--sb-border'?: string;
    '--sb-border-hover'?: string;
    '--sb-border-active'?: string;

    '--sb-font-size'?: string;
    '--sb-line-height'?: string;

    '--sb-image-size'?: string;
    '--sb-image-radius'?: string;
}

export type GridButtonProps = {
    row: number;
    col: number;
    button?: SbGridBtn;
    active?: boolean;
    progress?: number;
    zoom?: number;
    showImages?: boolean;
    className?: string;
    isDragging?: boolean;
    isDropping?: boolean;
    onClick?: (e: React.MouseEvent, btn: SbGridBtn, row: number, col: number) => void;
    onContextMenu?: (e: React.MouseEvent, btn: SbGridBtn, row: number, col: number) => void;
};

const GridButton = forwardRef<HTMLDivElement, GridButtonProps>((
    {
        row,
        col,
        button,
        active = false,
        progress = 0,
        zoom = 1,
        showImages = true,
        className,
        isDragging = false,
        isDropping = false,
        onClick,
        onContextMenu
    }, ref) => {
    const {boardType, activeGridProfile} = useProfiles();
    const {player} = usePlayer();

    const btn: SbGridBtn = button || {
        id: '',
        row,
        col,
        title: `Button ${row}-${col}`,
    };

    if (!btn.title) btn.title = `Button ${row}-${col}`;

    const onWheel = (e: React.WheelEvent<HTMLDivElement>, btn: SbGridBtn) => {
        const direction = e.deltaY < 0 ? 1 : -1;

        e.stopPropagation();

        const initialVolume = btn.volumeOverride ?? 100;
        const finalVolume = clamp(initialVolume + (direction * 2), 0, 100);

        window.electron.gridProfiles.buttons.update(boardType as Exclude<BoardType, 'ambient'>, activeGridProfile.id, btn.id, {volumeOverride: finalVolume});
        if (boardType === 'sfx') player.setSfxVolume(btn.id, finalVolume);
    }

    const dynamicStyle: CustomCSSProperties = useMemo(() => {
        const zoomFactor = Math.pow(clamp(zoom, 0.1, 2), 0.8);

        return ({
            '--sb-bg': btn.style?.backgroundColor || undefined,
            '--sb-bg-hover': btn.style?.backgroundColorHover || btn.style?.backgroundColor || undefined,
            '--sb-bg-active': btn.style?.backgroundColorActive || btn.style?.backgroundColor || undefined,

            '--sb-text': btn.style?.textColor || undefined,
            '--sb-text-hover': btn.style?.textColorHover || btn.style?.textColor || undefined,
            '--sb-text-active': btn.style?.textColorActive || btn.style?.textColor || undefined,

            '--sb-border': btn.style?.borderColor || undefined,
            '--sb-border-hover': btn.style?.borderColorHover || btn.style?.borderColor || undefined,
            '--sb-border-active': btn.style?.borderColorActive || btn.style?.borderColor || undefined,

            '--sb-progress': btn.style?.borderColorActive || btn.style?.borderColor || 'var(--primary)',

            '--sb-font-size': `${11 * zoomFactor}pt`,
            '--sb-line-height': `${11 * zoomFactor * 1.2}pt`,

            '--sb-image-size': `${30 * zoomFactor}px`,
            '--sb-image-radius': `${5 * zoomFactor}px`,

            justifyContent: showImages ? 'flex-start' : 'center',
        });
    }, [btn.style, zoom, showImages]);

    return (
        <div
            ref={ref}
            className={clsx(
                styles.btn,
                active && styles.active,
                className,
                isDragging && styles.dragging,
                isDropping && styles.dropping,
                !showImages && styles.centered
            )}
            style={dynamicStyle}
            onClick={(e) => onClick?.(e, btn, row, col)}
            onContextMenu={(e) => onContextMenu?.(e, btn, row, col)}
            onWheel={(e) => onWheel?.(e, btn)}
        >
            {showImages && (
                <img
                    className={styles.image}
                    src={btn.track ? (btn.track.downloading ? './images/download.png' : `disboard://thumbnail/${btn.track?.id}`) : './images/track.png'}
                    alt={btn.title || ''}
                    onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = './images/track.png';
                    }}
                />
            )}

            <span className={styles.text}>
                {btn.title}
            </span>
            <div
                className={styles.progress}
                style={{
                    width: `${progress}%`
                }}
            ></div>
            <div
                className={styles.volume}
                style={{
                    height: `${btn.volumeOverride ?? 0}%`
                }}
            ></div>
        </div>
    );
});

export default React.memo(GridButton);