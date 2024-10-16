import './SoundboardButton.css';
import {useData} from '../../ui/windowContext';
import React from "react";
import {getButton} from "../../ui/utils";
import {SbButton} from "../../utils/store/profiles";

interface SoundboardButtonProps {
    row: number;
    col: number;
    button?: SbButton;
    onClick?: (e: React.MouseEvent, btn: SbButton, row: number, col: number) => void;
    onContextMenu?: (e: React.MouseEvent, btn: SbButton, row: number, col: number) => void;
}

const SoundboardButton = ({row, col, button, onClick, onContextMenu}: SoundboardButtonProps) => {
    const {settings, activeProfile} = useData();

    const btn = button ? button : getButton(activeProfile, row, col);

    let thumbnail = 'url(images/track.png)';
    if (btn && btn.song?.thumbnail) thumbnail = `url(${btn.song.thumbnail})`;

    let image = null;
    if (settings.show_images) image = <div className={"sb-btn-img"} style={{backgroundImage: thumbnail}}></div>;

    const buttonStyle = {} as any;
    if (btn && btn.style) {
        if (btn.style.background_color) buttonStyle['--button-background'] = btn.style.background_color;
        if (btn.style.background_color_hover) buttonStyle['--button-background-hover'] = btn.style.background_color_hover;
        if (btn.style.text_color) buttonStyle['--button-text'] = btn.style.text_color;
        if (btn.style.text_color_hover) buttonStyle['--button-text-hover'] = btn.style.text_color_hover;
        if (btn.style.border_color) buttonStyle['--button-border'] = btn.style.border_color;
        if (btn.style.border_color_hover) buttonStyle['--button-border-hover'] = btn.style.border_color_hover;
    }

    const handleClick = (e: React.MouseEvent) => {
        if (onClick) onClick(e, btn, row, col);
    }

    const handleContextMenu = (e: React.MouseEvent) => {
        if (onContextMenu) onContextMenu(e, btn, row, col);
    }

    return (
        <div
            className={"sb-btn"}
            style={{justifyContent: image == null ? 'center' : 'flex-start', ...buttonStyle}}
            onClick={(e: React.MouseEvent) => handleClick(e)} onContextMenu={(e: React.MouseEvent) => handleContextMenu(e)}
        >
            {settings.show_images && image}
            <span className={"sb-btn-title"}>Button {row}.{col}</span>
        </div>
    );
}

export default SoundboardButton;