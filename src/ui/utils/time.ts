import {TimeUnit} from "../../types/track";

export class Time {
    private time: number;
    private unit: TimeUnit;

    constructor(time: number, unit: TimeUnit) {
        if (time === undefined || unit === undefined) throw new Error('Time and unit must be defined');
        if (time < 0) throw Error('Time cannot be negative');

        this.time = time;
        this.unit = unit;
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
        time = time.convertToUnit(this.unit);
        this.time = time.time;
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
        if (this.isLessThan(time)) throw new Error('Resulting time cannot be negative');
        this.time -= time.getTime(this.unit);
        return this;
    }

    copy(): Time {
        return new Time(this.time, this.unit);
    }
}