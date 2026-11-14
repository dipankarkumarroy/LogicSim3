/**
 * Event-driven digital waveform buffer and frequency tracker shared by Scope and Analyzer.
 */
class WaveformChannel {
    constructor(maxEvents = 512) {
        this.maxEvents = maxEvents;
        this.events = [];
        this.prevVal = 0;
        this.currentVal = 0;
        this.lastEdgeTime = 0;
        this.lastPeriodMs = 0;
        this.frequencyDisplay = '0 Hz';
    }

    /**
     * Records a sample at simulation timestamp `time`.
     * @param {boolean|number} rawVal
     * @param {number} time
     * @param {(hz: number) => string} formatFreq
     */
    sample(rawVal, time, formatFreq) {
        const newVal = rawVal ? 1 : 0;
        if (newVal !== this.prevVal) {
            if (this.prevVal === 0 && newVal === 1) {
                const delta = time - this.lastEdgeTime;
                if (this.lastEdgeTime > 0 && delta > 0) {
                    this.lastPeriodMs = delta;
                    this.frequencyDisplay = formatFreq(1000 / delta);
                }
                this.lastEdgeTime = time;
            }
            this.events.push({ t: time, v: newVal });
            if (this.events.length > this.maxEvents) {
                this.events.shift();
            }
            this.prevVal = newVal;
        }
        this.currentVal = newVal;

        const timeoutMs = Math.max(3000, this.lastPeriodMs * 2.5);
        if (this.lastEdgeTime > 0 && time - this.lastEdgeTime > timeoutMs) {
            this.frequencyDisplay = '0 Hz';
            this.lastPeriodMs = 0;
        }
    }

    /**
     * Draws a crisp square-wave trace over [tStart, tEnd] within the specified rectangle.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} x
     * @param {number} width
     * @param {number} yLow
     * @param {number} yHigh
     * @param {number} tStart
     * @param {number} tEnd
     */
    drawTrace(ctx, x, width, yLow, yHigh, tStart, tEnd) {
        const windowMs = tEnd - tStart;
        if (windowMs <= 0 || width <= 0) return;

        const yFor = (v) => (v ? yHigh : yLow);
        let curVal = this.events.length > 0 ? (this.events[0].v ? 0 : 1) : this.currentVal;

        for (let i = 0; i < this.events.length; i++) {
            const ev = this.events[i];
            if (ev.t <= tStart) curVal = ev.v;
            else break;
        }

        ctx.beginPath();
        ctx.moveTo(x, yFor(curVal));

        for (let i = 0; i < this.events.length; i++) {
            const ev = this.events[i];
            if (ev.t <= tStart) continue;
            if (ev.t > tEnd) break;
            const px = x + ((ev.t - tStart) / windowMs) * width;
            ctx.lineTo(px, yFor(curVal));
            ctx.lineTo(px, yFor(ev.v));
            curVal = ev.v;
        }

        ctx.lineTo(x + width, yFor(curVal));
        ctx.stroke();
    }
}

/**
 * Single-channel Oscilloscope (`SCOPE`) analysis component with auto-ranging timebase.
 */
class ScopeComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.inputs = [0];
        this.outputs = [];
        this.w = 100;
        this.h = 60;
        this.color = '#1a202c';
        this.channel = new WaveformChannel(512);
        this.lastSampleTime = 0;
        this.initIO();
    }

    /**
     * Records a new sample and updates rising-edge frequency estimate.
     * @param {number} time
     */
    updateScope(time) {
        this.lastSampleTime = time;
        this.channel.sample(this.inputState[0], time, (hz) => this.formatFreq(hz));
        this.frequencyDisplay = this.channel.frequencyDisplay;
    }

    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);

        const windowMs = this.channel.lastPeriodMs > 0
            ? Math.max(0.0001, Math.min(2000, this.channel.lastPeriodMs * 4))
            : 1000;
        const tEnd = this.lastSampleTime || 0;
        const tStart = tEnd - windowMs;

        ctx.strokeStyle = '#4ade80';
        ctx.lineWidth = 1.5;
        this.channel.drawTrace(ctx, this.x, this.w, this.y + this.h - 5, this.y + 5, tStart, tEnd);

        ctx.fillStyle = '#4ade80';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.frequencyDisplay, this.x + this.w - 5, this.y + 12);

        this.drawPins(ctx);
    }
}

ComponentRegistry.register('SCOPE', ScopeComponent);
