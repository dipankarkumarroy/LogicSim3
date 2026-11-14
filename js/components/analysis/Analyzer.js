/**
 * 16-channel Logic Analyzer (`ANALYZER`) component with synchronized auto-ranging timebase.
 */
class AnalyzerComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.inputs = Array.from({ length: 16 }, (_, i) => i);
        this.outputs = [];
        this.w = 250;
        this.h = 340;
        this.color = '#1a202c';
        this.resizable = true;
        this.minW = 200;
        this.minH = 340;
        this.channels = Array.from({ length: 16 }, () => new WaveformChannel(512));
        this.lastSampleTime = 0;
        this.initIO();
    }

    /**
     * Records a new sample across all 16 channels and updates per-channel frequency estimates.
     * @param {number} time
     */
    updateAnalyzer(time) {
        this.lastSampleTime = time;
        const format = (hz) => this.formatFreq(hz);
        for (let i = 0; i < 16; i++) {
            this.channels[i].sample(this.inputState[i], time, format);
            this.frequencies[i] = this.channels[i].frequencyDisplay;
        }
    }

    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);

        ctx.fillStyle = '#e0e0e0';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('LOGIC ANALYZER', this.x + 10, this.y + 12);

        // Synchronized time window based on the fastest active channel
        let minActivePeriod = Infinity;
        for (let ch = 0; ch < 16; ch++) {
            const p = this.channels[ch].lastPeriodMs;
            if (p > 0 && p < minActivePeriod) {
                minActivePeriod = p;
            }
        }
        const windowMs = minActivePeriod < Infinity
            ? Math.max(0.0001, Math.min(2000, minActivePeriod * 8))
            : 1000;
        const tEnd = this.lastSampleTime || 0;
        const tStart = tEnd - windowMs;

        const chH = (this.h - 20) / 16;
        const traceX = this.x + 30;
        const traceW = Math.max(20, this.w - 75);

        for (let ch = 0; ch < 16; ch++) {
            const by = this.y + 25 + ch * chH;
            ctx.fillStyle = '#888';
            ctx.font = '9px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(ch.toString(16).toUpperCase(), this.x + 5, by + 5);

            ctx.strokeStyle = this.inputState[ch] ? '#22d3ee' : '#0891b2';
            ctx.lineWidth = 1;
            this.channels[ch].drawTrace(ctx, traceX, traceW, by + 8, by + 2, tStart, tEnd);

            ctx.fillStyle = '#6b7280';
            ctx.textAlign = 'right';
            ctx.fillText(this.frequencies[ch], this.x + this.w - 5, by + 5);
        }

        this.drawPins(ctx);
    }
}

ComponentRegistry.register('ANALYZER', AnalyzerComponent);
