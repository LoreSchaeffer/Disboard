const isObject = (item: unknown): item is Record<string, unknown> => {
    return Boolean(item && typeof item === 'object' && !Array.isArray(item));
}

export const deepMerge = <T extends object>(target: T, source: Partial<T>): T => {
    const output = {...target};

    if (isObject(target) && isObject(source)) {
        Object.keys(source).forEach(key => {
            const k = key as keyof T;
            const sourceValue = source[k];
            const targetValue = target[k];

            if (isObject(sourceValue) && isObject(targetValue)) {
                // @ts-expect-error: TS can't infer this correctly
                output[k] = deepMerge(targetValue, sourceValue);
            } else {
                if (sourceValue !== undefined) output[k] = sourceValue;
            }
        });
    }

    return output;
}

export const pruneNulls = <T>(obj: T): T => {
    if (Array.isArray(obj)) return obj.map(v => pruneNulls(v)).filter(v => v !== null) as unknown as T;

    if (obj !== null && typeof obj === 'object') {
        const target = {...obj};

        Object.keys(target).forEach(key => {
            const k = key as keyof typeof target;
            const value = target[k];

            if (value === null) {
                delete target[k];
            } else if (typeof value === 'object') {
                const cleanedValue = pruneNulls(value);

                if (cleanedValue && Object.keys(cleanedValue).length === 0) delete target[k];
                else target[k] = cleanedValue;
            }
        });

        return target;
    }

    return obj;
}