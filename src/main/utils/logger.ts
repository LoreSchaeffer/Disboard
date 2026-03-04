import log from 'electron-log/main';

export const setupLogger = () => {
    log.transports.file.maxSize = 0;
    log.transports.file.getFile().clear();
    log.transports.file.format = '[{y}-{m}-{d} {h}:{i}:{s}.{ms}] [{level}] {text}';

    log.transports.console.format = '{color}[{h}:{i}:{s}.{ms}] [{level}] {text}{color:reset}';

    Object.assign(console, log.functions);

    console.info('[Logger] Initialized successfully.');
    console.info(`[Logger] Log file location: ${log.transports.file.getFile().path}`);
}