import styles from "./SoundboardButton.module.css";
import React, {CSSProperties, forwardRef, useMemo} from "react";
import {useWindow} from "../../context/WindowContext";
import {clamp} from "../../../utils/utils";
import {clsx} from "clsx";
import {SbButton} from "../../../types/profiles";

export type SoundboardButtonProps = {
    row: number;
    col: number;
    button?: SbButton;
    active?: boolean;
    className?: string;
    isDragging?: boolean;
    isDropping?: boolean;
    onClick?: (e: React.MouseEvent, btn: SbButton, row: number, col: number) => void;
    onContextMenu?: (e: React.MouseEvent, btn: SbButton, row: number, col: number) => void;
};

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

const SoundboardButton = forwardRef<HTMLDivElement, SoundboardButtonProps>((
    {
        row,
        col,
        button,
        active = false,
        className,
        isDragging = false,
        isDropping = false,
        onClick,
        onContextMenu
    }, ref) => {
    const {settings} = useWindow();

    const btn = useMemo(() => button || {
        row,
        col,
        title: `Button ${row}-${col}`,
        track: null
    }, [button, row, col]);

    const dynamicStyle: CustomCSSProperties = useMemo(() => {
        const zoomFactor = Math.pow(clamp((settings.zoom || 1), 0.1, 2), 0.8);

        return ({
            '--sb-bg': btn.style?.background_color || undefined,
            '--sb-bg-hover': btn.style?.background_color_hover || btn.style?.background_color || undefined,
            '--sb-bg-active': btn.style?.background_color_active || btn.style?.background_color || undefined,

            '--sb-text': btn.style?.text_color || undefined,
            '--sb-text-hover': btn.style?.text_color_hover || btn.style?.text_color || undefined,
            '--sb-text-active': btn.style?.text_color_active || btn.style?.text_color || undefined,

            '--sb-border': btn.style?.border_color || undefined,
            '--sb-border-hover': btn.style?.border_color_hover || btn.style?.border_color || undefined,
            '--sb-border-active': btn.style?.border_color_active || btn.style?.border_color || undefined,

            '--sb-font-size': `${11 * zoomFactor}pt`,
            '--sb-line-height': `${11 * zoomFactor * 1.2}pt`,

            '--sb-image-size': `${30 * zoomFactor}px`,
            '--sb-image-radius': `${5 * zoomFactor}px`,

            justifyContent: settings.showImages ? 'flex-start' : 'center',
        })
    }, [btn, settings.zoom, settings.showImages]);

    return (
        <div
            ref={ref}
            className={clsx(
                styles.btn,
                active && styles.active,
                className,
                isDragging && styles.dragging,
                isDropping && styles.dropping
            )}
            style={dynamicStyle}
            onClick={(e) => onClick?.(e, btn, row, col)}
            onContextMenu={(e) => onContextMenu?.(e, btn, row, col)}
            title={btn.title}
        >
            {settings.showImages && (
                <img
                    className={styles.image}
                    src={btn.track ? `music://images/${btn.track?.id}` : '/images/track.png'}
                    alt={btn.title || ''}
                    onError={(e) => {
                        const img = e.currentTarget;
                        img.onerror = null;
                        img.src = '/images/track.png';
                    }}
                />
            )}

            <span className={styles.text}>
                {btn.title}
            </span>
        </div>
    );
});

export default React.memo(SoundboardButton);