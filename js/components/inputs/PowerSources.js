/**
 * Constant HIGH (VCC) and LOW (GND) power source components.
 */
class PowerSourceComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.inputs = [];
        this.outputs = [0];
        this.w = 40;
        this.h = 40;
        this.color = '#2d3748';
        this.state = type === 'VCC';
        this.initIO();
        if (type === 'VCC') {
            this.outputState[0] = true;
        }
    }

    calculate() {
        this.outputState[0] = this.type === 'VCC';
    }

    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        if (this.type === 'VCC') {
            ctx.fillStyle = '#f87171';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('VCC', cx, cy);
        } else {
            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, this.y + 8);
            ctx.lineTo(cx, cy + 5);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx - 10, cy + 5);
            ctx.lineTo(cx + 10, cy + 5);
            ctx.moveTo(cx - 6, cy + 9);
            ctx.lineTo(cx + 6, cy + 9);
            ctx.stroke();
        }

        this.drawPins(ctx);
    }
}

ComponentRegistry.register(['VCC', 'GND'], PowerSourceComponent);
