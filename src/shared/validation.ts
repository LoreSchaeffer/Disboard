const nameRegex = /^[\p{L}\p{N}\s]+$/u;
export const validateName = (name: string, ignoreSize: boolean = false) => {
    if (!ignoreSize) {
        if (!name || name.trim().length === 0) return false;
        if (name.length < 3 || name.length > 32) return false;
    }
    return nameRegex.test(name);
}

export const removeNameInvalidChars = (name: string) => {
    return name.replace(/[^\p{L}\p{N}\s\-_()]/gu, '');
}