import './Button.css';
import {ReactNode} from "react";
import {IconType} from "../../ui/icons";
import SvgIcon from "./SvgIcon";

type ButtonType = 'primary' | 'danger' | 'success';

type ButtonProps = {
    children: ReactNode;
    className?: ButtonType;
    icon?: IconType;
    onClick?: () => void;
    disabled?: boolean;
}

const Button = ({children, className, icon, onClick, disabled = false}: ButtonProps) => {

    const handleClick = () => {
        if (onClick && !disabled) onClick();
    }

    return (
        <button className={`btn${className ? ' ' + 'btn-' + className : ''}${disabled ? ' disabled' : ''}`} onClick={handleClick}>
            {icon && <SvgIcon className={"btn-icon"} icon={icon}/>}
            {children}
        </button>
    )
};

export default Button;