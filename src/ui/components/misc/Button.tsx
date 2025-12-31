import styles from './Button.module.css';
import {ButtonHTMLAttributes, forwardRef, ReactNode} from "react";
import {Variant} from "../../types/common";
import {clsx} from "clsx";
import Spinner from "./Spinner";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    variant: Variant;
    icon?: ReactNode;
    loading?: boolean;
    fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>((
    {
        variant,
        icon,
        loading = false,
        fullWidth = false,
        disabled,
        className,
        type = 'button',
        children,
        ...props
    }: ButtonProps, ref) => {
    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            className={clsx(
                styles.btn,
                styles[variant],
                disabled && styles.disabled,
                loading && styles.loading,
                className
            )}
            {...props}
        >
            {loading ? (
                <span className={styles.icon}><Spinner size="sm" light={true}/></span>
            ) : icon ? (
                <span className={styles.icon}>{icon}</span>
            ) : null}

            {children}
        </button>
    )
});

export default Button;