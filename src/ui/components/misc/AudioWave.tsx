import styles from './AudioWave.module.css';
import {useEffect, useRef} from "react";

type AudioWaveProps = {
    variant: 'smooth' | 'assistant' | 'random' | 'blob' | 'gradient' | 'responsive';
    className?: string;
    onClick?: () => void;
}

const BAR_COUNT = 5;

const AudioWave = ({variant, className, onClick}: AudioWaveProps) => {
    const barsRef = useRef<HTMLDivElement[]>([]);

    useEffect(() => {
        if (variant !== 'random') return;
        const bars = barsRef.current;
        if (!bars) return;

        let animationFrame: number;

        const animate = () => {
            bars.forEach((bar) => {
                const min = 6;
                const max = 28;
                const newHeight = Math.floor(Math.random() * (max - min + 1)) + min;
                bar.style.height = `${newHeight}px`;
            });
            animationFrame = requestAnimationFrame(animate);
        };

        animationFrame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(animationFrame);
    }, [variant]);

    if (variant === 'blob') {
        const classNames = `
          ${styles.audioWave}
          ${styles.blob}
          ${className}
        `.trim();

        return (
            <svg
                className={classNames}
                viewBox="0 0 120 40"
                preserveAspectRatio="none"
                onClick={onClick}
            >
                <path className={styles.blobPath} d="M0 20 Q 30 0 60 20 T 120 20"/>
            </svg>
        );
    }

    const classNames = `
        ${styles.audioWave}
        ${styles[variant]}
        ${className}
      `.trim();

    return (
        <div className={classNames} onClick={onClick}>
            {Array.from({length: BAR_COUNT}).map((_, i) => (
                <div
                    key={i}
                    ref={(el) => {
                        if (el) barsRef.current[i] = el;
                    }}
                />
            ))}
        </div>
    );
};

export default AudioWave;