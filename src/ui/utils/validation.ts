const nameRegex = /^[a-zA-Z0-9 \-_/]+$/;
export const validateName = (name: string, ignoreSize: boolean = false) => {
    if (!ignoreSize) {
        if (!name || name.trim().length === 0) return false;
        if (name.length < 3 || name.length > 32) return false;
    }
    return nameRegex.test(name);
}