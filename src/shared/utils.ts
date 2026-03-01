export const clamp = (num: number, min: number, max: number): number => {
    return Math.min(Math.max(num, min), max);
}

export const getGridBtnId = (row: number, col: number): string => {
    return `btn_${row}_${col}`;
}

export const getPosFromGridBtnId = (buttonId: string): { row: number, col: number } | null => {
    const match = buttonId.match(/^btn_(\d+)_(\d+)$/);
    if (!match) return null;
    const row = parseInt(match[1], 10);
    const col = parseInt(match[2], 10);
    return {row, col};
}