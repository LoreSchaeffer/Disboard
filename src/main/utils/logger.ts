import log from 'electron-log/main';

export const setupLogger = () => {
    log.transports.file.maxSize = 0;
    log.transports.file.getFile().clear();
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

    log.transports.console.useStyles = false;

    log.transports.console.format = (params) => {
        const {message} = params;
        const date = message.date;

        const h = String(date.getHours()).padStart(2, '0');
        const i = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        const ms = String(date.getMilliseconds()).padStart(3, '0');

        const timeString = `${h}:${i}:${s}.${ms}`;
        const level = message.level;

        const colors: Record<string, string> = {
            error: '\x1b[31m',   // Red
            warn: '\x1b[33m',    // Yellow
            info: '\x1b[36m',    // Cyan
            verbose: '\x1b[35m', // Magenta
            debug: '\x1b[34m',   // Blue
            silly: '\x1b[32m',   // Green
        };

        const reset = '\x1b[0m';
        const color = colors[level] || reset;

        const prefix = `${color}[${timeString}] [${level}]${reset}`;

        return [prefix, ...message.data];
    };

    Object.assign(console, log.functions);

    console.info('[Logger] Initialized successfully.');
    console.info(`[Logger] Log file location: ${log.transports.file.getFile().path}`);
}