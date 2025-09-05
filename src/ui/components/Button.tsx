import styles from './Button.module.css';
import {ReactNode} from "react";
import SvgIcon, {IconType} from "./SvgIcon";

type ButtonType = 'primary' | 'danger' | 'success';

type ButtonProps = {
    children: ReactNode;
    className?: string;
    type?: ButtonType;
    icon?: IconType;
    onClick?: () => void;
    disabled?: boolean;
}

const Button = (
    {
        children,
        className,
        type,
        icon,
        onClick,
        disabled = false
    }: ButtonProps) => {

    const handleClick = () => {
        if (onClick && !disabled) onClick();
    }

    return (
        <button
            className={`${styles.btn} ${type ? styles[type] : ''} ${className || ''} ${disabled ? ' disabled' : ''}`}
            onClick={handleClick}
            disabled={disabled}
        >
            {icon && <SvgIcon className={"btn-icon"} icon={icon}/>}
            {children}
        </button>
    )
};

export default Button;