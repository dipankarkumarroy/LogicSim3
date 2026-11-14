/**
 * Periodic square-wave clock signal generator component.
 */
class ClockComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.inputs = [];
        this.outputs = [0];
        this.w = 40;
        this.h = 40;
        this.color = '#2d3748';
        this.initIO();
    }

    /**
     * Advances the clock state based on elapsed simulation time without phase drift.
     * @param {number} time
     */
    updateClock(time) {
        if (this.interval <= 0) return;
        const elapsed = time - this.lastToggle;
        if (elapsed >= this.interval) {
            if (elapsed > this.interval * 2) {
                const steps = Math.floor(elapsed / this.interval);
                if (steps % 2 === 1) this.state = !this.state;
                this.lastToggle += steps * this.interval;
            } else {
                this.state = !this.state;
                this.lastToggle += this.interval;
            }
        }
        this.outputState[0] = this.state;
    }

    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = this.frequency >= 1000 ? this.formatFreq(this.frequency) : `${this.frequency}Hz`;
        ctx.fillText(label, cx, cy - 5);

        ctx.fillStyle = this.state ? '#4ade80' : '#333';
        ctx.fillRect(cx - 10, cy + 2, 20, 4);

        this.drawPins(ctx);
    }
}

ComponentRegistry.register('CLOCK', ClockComponent);
