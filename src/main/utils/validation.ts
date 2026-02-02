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

// eslint-disable-next-line no-control-regex
const fileNameInvalidCharsRegex = /[<>:"/\\|?*\x00-\x1F]/g;
export const generateValidFileName = (name: string, def?: string, ext: string = '.json') => {
    if (name.toLowerCase().endsWith(ext.toLowerCase())) name = name.substring(0, name.length - ext.length);

    let validName = name.replace(fileNameInvalidCharsRegex, '_').trim();
    if (validName.length === 0) validName = def || 'Untitled';
    if (validName.length > 64) validName = validName.substring(0, 64);
    return validName + ext;
}