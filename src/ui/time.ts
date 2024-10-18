import {TimeUnit} from "../utils/store/profiles";

export class Time {
    private time: number;
    private unit: TimeUnit;

    constructor(time: number, unit: TimeUnit) {
        if (time === undefined || unit === undefined) throw new Error('Time and unit must be defined');

        this.time = time;
        this.unit = unit;
    }

    getTime(): number {
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
        time = time.convertToUnit(this.unit);
        this.time = time.time;
        return this;
    }

    isNegative(): boolean {
        return this.time < 0;
    }

    convertToMilliseconds(): Time {
        if (this.unit === 's') {
            this.time = this.time * 1000;
            this.unit = 'ms';
        } else if (this.unit === 'm') {
            this.time = this.time * 60000;
            this.unit = 'ms';
        }

        return this;
    }

    convertToSeconds(): Time {
        if (this.unit === 'ms') {
            this.time = this.time / 1000;
            this.unit = 's';
        } else if (this.unit === 'm') {
            this.time = this.time * 60;
            this.unit = 's';
        }

        return this;
    }

    convertToMinutes(): Time {
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
        if (newUnit === 'ms') this.convertToMilliseconds();
        else if (newUnit === 's') this.convertToSeconds();
        else if (newUnit === 'm') this.convertToMinutes();

        return this;
    }

    toMilliseconds(): number {
        if (this.unit === 's') return this.time * 1000;
        else if (this.unit === 'm') return this.time * 60000;
        return this.time;
    }

    toSeconds(): number {
        if (this.unit === 'ms') return this.time / 1000;
        else if (this.unit === 'm') return this.time * 60;
        return this.time;
    }

    toMinutes(): number {
        if (this.unit === 'ms') return this.time / 60000;
        else if (this.unit === 's') return this.time / 60;
        return this.time;
    }

    toUnit(unit: TimeUnit): number {
        if (unit === 'ms') return this.toMilliseconds();
        else if (unit === 's') return this.toSeconds();
        else if (unit === 'm') return this.toMinutes();
    }

    add(time: Time): Time {
        const copy = new Time(this.time, this.unit);
        copy.time += time.toUnit(copy.unit);
        return copy;
    }

    subtract(time: Time): Time {
        const copy = new Time(this.time, this.unit);
        copy.time -= time.toUnit(copy.unit);
        return copy;
    }

    isGreaterThan(time: Time): boolean {
        return this.convertToMilliseconds() > time.convertToMilliseconds();
    }

    isLessThan(time: Time): boolean {
        return this.convertToMilliseconds() < time.convertToMilliseconds();
    }

    equals(time: Time): boolean {
        return this.convertToMilliseconds() === time.convertToMilliseconds();
    }
}