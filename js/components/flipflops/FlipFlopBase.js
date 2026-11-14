/**
 * Shared base class for edge-triggered Flip-Flop components.
 * Unifies 2-input (top/clock) and 3-input (top/clock/bottom) layouts, Q/!Q outputs, and rendering.
 */
class FlipFlopBase extends BaseComponent {
    /**
     * @param {string} type
     * @param {number} x
     * @param {number} y
     * @param {string} id
     * @param {{color: string, topLabel: string, bottomLabel?: string}} config
     */
    constructor(type, x, y, id, config) {
        super(type, x, y, id);
        this.topLabel = config.topLabel;
        this.bottomLabel = config.bottomLabel || null;
        this.isThreeInput = Boolean(this.bottomLabel);

        this.inputs = this.isThreeInput ? [0, 1, 2] : [0, 1];
        this.outputs = [2, 3];
        this.w = 60;
        this.h = this.isThreeInput ? 100 : 80;
        this.color = config.color;
        this.state = false;

        this.initIO();
        this.outputState[1] = true;
    }

    /**
     * Updates Q and !Q output states from `this.state`.
     */
    syncOutputs() {
        this.outputState[0] = this.state;
        this.outputState[1] = !this.state;
    }

    getLocalInputPos(index) {
        if (index === 0) return { x: this.x - 10, y: this.y + 20 };
        if (this.isThreeInput) {
            if (index === 1) return { x: this.x - 10, y: this.y + 50 };
            if (index === 2) return { x: this.x - 10, y: this.y + 80 };
        } else if (index === 1) {
            return { x: this.x - 10, y: this.y + this.h - 20 };
        }
        return super.getLocalInputPos(index);
    }

    getLocalOutputPos(index) {
        if (index === 0) return { x: this.x + this.w + 10, y: this.y + 20 };
        if (index === 1) return { x: this.x + this.w + 10, y: this.y + this.h - 20 };
        return super.getLocalOutputPos(index);
    }

    draw(ctx, isSelected) {
        this.applyBaseStyle(ctx, isSelected);
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';

        ctx.fillText(this.topLabel, this.x + 5, this.y + 20);
        if (this.bottomLabel) {
            ctx.fillText(this.bottomLabel, this.x + 5, this.y + 80);
        }

        // Clock edge triangle
        const clkY = this.isThreeInput ? this.y + 50 : this.y + this.h - 20;
        ctx.beginPath();
        ctx.moveTo(this.x, clkY - 5);
        ctx.lineTo(this.x + 10, clkY);
        ctx.lineTo(this.x, clkY + 5);
        ctx.stroke();

        ctx.textAlign = 'right';
        ctx.fillText('Q', this.x + this.w - 5, this.y + 20);
        ctx.fillText('!Q', this.x + this.w - 5, this.y + this.h - 20);

        this.drawPins(ctx);
    }
}
