import React, {forwardRef, PropsWithChildren} from "react";

export type RowProps = PropsWithChildren & {
    className?: string;
    warp?: boolean;
    alignItems?: 'center' | 'flex-start' | 'flex-end' | 'stretch' | 'baseline';
    alignContent?: 'center' | 'flex-start' | 'flex-end' | 'space-around' | 'space-between' | 'stretch';
    justify?: 'center' | 'flex-start' | 'flex-end' | 'space-around' | 'space-between' | 'space-evenly';
    gap?: string;
    styles?: React.CSSProperties
};

const Row = forwardRef<HTMLDivElement, RowProps>((
    {
        children,
        className,
        warp = true,
        alignItems = 'center',
        alignContent = 'flex-start',
        justify = 'flex-start',
        gap = '5px',
        styles
    }, ref) => {

    return (
        <div
            className={className}
            ref={ref}
            style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: warp ? 'wrap' : 'nowrap',
                alignItems: alignItems,
                alginContent: alignContent,
                justifyContent: justify,
                gap: gap,
                ...styles
            }}
        >
            {children}
        </div>
    );
});

export default Row;