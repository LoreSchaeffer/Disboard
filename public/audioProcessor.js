class PcmAudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.frameSize = 960;
        this.bufferSize = this.frameSize * 2;

        this.buffer = new Int16Array(this.bufferSize);
        this.sampleCount = 0;
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || input.length === 0) return true;

        const left = input[0];
        const right = input[1] || left;

        for (let i = 0; i < left.length; i++) {
            let l = left[i];
            if (l > 1) l = 1; else if (l < -1) l = -1;
            const lInt = l < 0 ? l * 0x8000 : l * 0x7FFF;

            let r = right[i];
            if (r > 1) r = 1; else if (r < -1) r = -1;
            const rInt = r < 0 ? r * 0x8000 : r * 0x7FFF;

            const idx = this.sampleCount * 2;
            this.buffer[idx] = lInt;
            this.buffer[idx + 1] = rInt;
            this.sampleCount++;

            if (this.sampleCount >= this.frameSize) {
                const bufferToSend = this.buffer.slice(0, this.bufferSize);
                this.port.postMessage(bufferToSend.buffer, [bufferToSend.buffer]);
                this.sampleCount = 0;
            }
        }

        return true;
    }
}

registerProcessor('pcm-processor', PcmAudioProcessor);