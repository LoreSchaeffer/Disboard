import {TimeUnit} from "../../types/profiles";

export const formatTime = (time: Time | number): string => {
    if (!time || (typeof (time) === 'number' && time < 0)) return '00:00';

    const totalSeconds = typeof (time) === 'number' ? time / 1000 : time.getTimeS();

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.round(totalSeconds % 60);

    let formatted = '';
    if (hours > 0) formatted += hours + ':';
    formatted += minutes.toString() + ':';
    formatted += seconds.toString().padStart(2, '0');

    return formatted;
}

export class Time {
    private time: number;
    private unit: TimeUnit;

    constructor(time: number, unit: TimeUnit) {
        if (time === undefined || unit === undefined) throw new Error('Time and unit must be defined');
        if (time < 0) throw Error('Time cannot be negative');

        this.time = time;
        this.unit = unit;
    }

    static fromMs(ms: number): Time {
        return new Time(ms, 'ms');
    }

    static fromS(s: number): Time {
        return new Time(s, 's');
    }

    getTime(unit: TimeUnit | null): number {
        if (unit == null) return this.time;
        if (unit === 'ms') return this.getTimeMs();
        else if (unit === 's') return this.getTimeS();
        return this.getTimeM();
    }

    getTimeMs(): number {
        if (this.unit === 's') return this.time * 1000;
        else if (this.unit === 'm') return this.time * 60000;
        return this.time;
    }

    getTimeS(): number {
        if (this.unit === 'ms') return this.time / 1000;
        else if (this.unit === 'm') return this.time * 60;
        return this.time;
    }

    getTimeM(): number {
        if (this.unit === 'ms') return this.time / 60000;
        else if (this.unit === 's') return this.time / 60;
        return this.time;
    }

    getTimeUnit(): TimeUnit {
        return this.unit;
    }

    setTime(time: number): Time {
        this.time = time;
        return this;
    }

    setTimeUnit(unit: TimeUnit): Time {
        this.unit = unit;
        return this;
    }

    setTimeAndUnit(time: number, unit: TimeUnit): Time {
        this.time = time;
        this.unit = unit;
        return this;
    }

    setTimeKeepUnit(time: Time): Time {
        this.time = time.getTime(this.unit);
        return this;
    }

    convertToMs(): Time {
        if (this.unit === 's') {
            this.time = this.time * 1000;
            this.unit = 'ms';
        } else if (this.unit === 'm') {
            this.time = this.time * 60000;
            this.unit = 'ms';
        }

        return this;
    }

    convertToS(): Time {
        if (this.unit === 'ms') {
            this.time = this.time / 1000;
            this.unit = 's';
        } else if (this.unit === 'm') {
            this.time = this.time * 60;
            this.unit = 's';
        }

        return this;
    }

    convertToM(): Time {
        if (this.unit === 'ms') {
            this.time = this.time / 60000;
            this.unit = 'm';
        } else if (this.unit === 's') {
            this.time = this.time / 60;
            this.unit = 'm';
        }

        return this;
    }

    convertToUnit(newUnit: TimeUnit): Time {
        if (newUnit === 'ms') this.convertToMs();
        else if (newUnit === 's') this.convertToS();
        else if (newUnit === 'm') this.convertToM();

        return this;
    }

    isGraterThan(time: Time): boolean {
        return this.getTimeMs() > time.getTimeMs();
    }

    isLessThan(time: Time): boolean {
        return this.getTimeMs() < time.getTimeMs();
    }

    equals(time: Time): boolean {
        return this.getTimeMs() === time.getTimeMs();
    }

    add(time: Time): Time {
        this.time += time.getTime(this.unit);
        return this;
    }

    subtract(time: Time): Time {
        const result = this.time - time.getTime(this.unit);
        if (result < 0) {
            console.warn("Time subtraction resulted in negative value, clamping to 0");
            this.time = 0;
        } else {
            this.time = result;
        }
        return this;
    }

    copy(): Time {
        return new Time(this.time, this.unit);
    }

    formatted(): string {
        return formatTime(this);
    }
}