import styles from "./SoundboardButton.module.css";
import React, {forwardRef, MouseEvent, useEffect, useState} from "react";
import {useWindow} from "../../context/WindowContext";
import {SbButton} from "../../../types/storage";

type SoundboardButtonProps = {
    row: number;
    col: number;
    button?: SbButton;
    onClick?: (e: React.MouseEvent, btn: SbButton, row: number, col: number) => void;
    onContextMenu?: (e: React.MouseEvent, btn: SbButton, row: number, col: number) => void;
};

const SoundboardButton = forwardRef<HTMLDivElement, SoundboardButtonProps>((
        {
            row,
            col,
            button,
            onClick,
            onContextMenu
        }, ref) => {
        const {settings} = useWindow();
        const [defaultStyle, setDefaultStyle] = useState<React.CSSProperties>({});
        const [hoverStyle, setHoverStyle] = useState<React.CSSProperties>({});
        const [style, setStyle] = useState<React.CSSProperties>({});
        
        const btn = button || {row, col, title: `Button ${row}-${col}`, track: null};

        useEffect(() => {
            const newDefaultStyle = {
                backgroundColor: btn.style?.background_color || 'var(--btn-background)',
                color: btn.style?.text_color || 'var(--btn-text)',
                borderColor: btn.style?.border_color || 'var(--btn-border)',
            };

            const newHoverStyle = {
                backgroundColor: btn.style?.background_color_hover || btn.style?.background_color || 'var(--btn-background-hover)',
                color: btn.style?.text_color_hover || btn.style?.text_color || 'var(--btn-text-hover)',
                borderColor: btn.style?.border_color_hover || btn.style?.border_color || 'var(--btn-border-hover)',
            };

            setDefaultStyle(newDefaultStyle);
            setHoverStyle(newHoverStyle);
            setStyle(newDefaultStyle);
        }, []);


        const getImage = () => {
            let image = 'url(/images/track.png)';
            if (btn.track?.thumbnail) image = `url(${btn.track.thumbnail})`;

            return <div className={styles.sbBtnImage} style={{backgroundImage: image}}/>;
        }

        const handleClick = (e: MouseEvent) => {
            onClick?.(e, btn, row, col);
        }

        const handleContextMenu = (e: MouseEvent) => {
            onContextMenu?.(e, btn, row, col);
        }

        const onMouseEnter = (e: MouseEvent) => {
            const target = e.currentTarget as HTMLElement;
            if (target.classList.contains('dropping')) return;
            setStyle(hoverStyle);
        }

        return (
            <div
                ref={ref}
                className={styles.sbBtn}
                style={{justifyContent: settings.show_images ? 'flex-start' : 'center', ...style}}
                onClick={(e: React.MouseEvent) => handleClick(e)}
                onContextMenu={(e: React.MouseEvent) => handleContextMenu(e)}
                onMouseEnter={onMouseEnter}
                onMouseLeave={() => setStyle(defaultStyle)}
            >
                {settings.show_images && getImage()}
                <span
                    className={styles.sbBtnText}
                    style={{
                        fontSize: settings.font_size + "pt",
                        lineHeight: settings.font_size * 1.2 + "pt",
                }}
                >{btn.title}
                </span>
            </div>
        );
    }
);

export default SoundboardButton;