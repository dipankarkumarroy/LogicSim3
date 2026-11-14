/**
 * Indicator Light (`LIGHT`) and polarity-sensitive LED (`LED`) output components.
 */
class LightComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.inputs = [0];
        this.outputs = [];
        this.w = 40;
        this.h = 40;
        this.color = '#2d3748';
        this.initIO();
    }

    calculate() {
        this.state = this.inputState[0];
    }

    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        ctx.fillStyle = this.state ? '#facc15' : '#000000';
        ctx.shadowBlur = this.state ? 15 : 0;
        ctx.shadowColor = '#facc15';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        this.drawPins(ctx);
    }
}

class LedComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.inputs = [0, 1];
        this.outputs = [];
        this.w = 30;
        this.h = 30;
        this.color = '#2d3748';
        this.initIO();
    }

    calculate() {
        this.state = this.inputState[0] && this.inputContention[1].hasLow;
    }

    getLocalInputPos(index) {
        const cx = this.x + (this.w ? this.w / 2 : 20);
        const cy = this.y + (this.h ? this.h / 2 : 20);
        return {
            x: cx + (index === 0 ? -6 : 6),
            y: cy + (index === 0 ? 25 : 15)
        };
    }

    draw(ctx, isSelected) {
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        ctx.strokeStyle = isSelected ? '#60a5fa' : '#9ca3af';
        ctx.lineWidth = 2;
        const pA = this.getLocalInputPos(0);
        const pC = this.getLocalInputPos(1);

        ctx.beginPath();
        ctx.moveTo(pA.x, cy);
        ctx.lineTo(pA.x, pA.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(pC.x, cy);
        ctx.lineTo(pC.x, pC.y);
        ctx.stroke();

        ctx.fillStyle = this.state ? '#ef4444' : '#7f1d1d';
        ctx.shadowBlur = this.state ? 20 : 0;
        ctx.shadowColor = '#ef4444';
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0.1 * Math.PI, 0.9 * Math.PI, true);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', pA.x - 12, cy + 15);
        ctx.fillText('-', pC.x + 4, cy + 15);
    }
}

ComponentRegistry.register('LIGHT', LightComponent);
ComponentRegistry.register('LED', LedComponent);
