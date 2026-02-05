import styles from './PlayerBtn.module.css';
import {ButtonHTMLAttributes, forwardRef, ReactElement} from "react";
import {clsx} from "clsx";

type PlayerBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: ReactElement,
    size?: 'normal' | 'large',
}

const PlayerBtn = forwardRef<HTMLButtonElement, PlayerBtnProps>((
        {
            icon,
            size = 'normal',
            disabled = false,
            type = 'button',
            className,
            ...props
        }: PlayerBtnProps, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                className={clsx(
                    styles.btn,
                    size === 'large' && styles.large,
                    disabled && styles.disabled,
                    className
                )}
                disabled={disabled}
                {...props}
            >
                {icon}
            </button>
        )
    }
);

export default PlayerBtn;