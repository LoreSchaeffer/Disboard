import './ColorSetting.css';

import SvgIcon from "../generic/SvgIcon";
import ColorPicker from "../generic/forms/ColorPicker";

type ColorSettingProps = {
    label: string;
    color: string;
    onChange: (color: string) => void;
};

const ColorSetting = ({label, color, onChange}: ColorSettingProps) => {
    return (
        <div className={"row"}>
            <label>{label}</label>
            <ColorPicker value={color} onChange={onChange}/>
            <SvgIcon icon={"undo"} onClick={() => onChange(undefined)}/>
        </div>
    );
}

export default ColorSetting;