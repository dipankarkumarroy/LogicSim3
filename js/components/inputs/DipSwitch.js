/**
 * Multi-bit DIP switch bank input component.
 */
class DipSwitchComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.w = 60;
        this.color = '#1e3a8a';
        this.switchState = [];
        this.updateBits(8);
    }

    updateBits(n) {
        this.bits = n;
        this.inputs = [];
        this.outputs = Array.from({ length: n }, (_, i) => i);
        this.switchState = new Array(n).fill(false);
        this.h = Math.max(40, n * 15);
        this.initIO();
    }

    toggle(pos) {
        if (!pos) return;
        const localPos = this.worldToLocal(pos);
        const relY = localPos.y - this.y;
        const switchH = this.h / this.bits;
        const index = Math.floor(relY / switchH);
        if (index >= 0 && index < this.bits) {
            this.switchState[index] = !this.switchState[index];
        }
    }

    calculate() {
        for (let i = 0; i < this.bits; i++) {
            this.outputState[i] = this.switchState[i];
        }
    }

    getLocalOutputPos(index) {
        const step = this.h / this.bits;
        return { x: this.x + this.w + 10, y: this.y + step * index + step / 2 };
    }

    draw(ctx, isSelected) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = isSelected ? '#60a5fa' : '#111';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        const swH = this.h / this.bits;
        ctx.font = '10px monospace';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < this.bits; i++) {
            const cy = this.y + i * swH + swH / 2;
            ctx.fillStyle = '#111';
            ctx.fillRect(this.x + 10, cy - 4, this.w - 20, 8);
            const on = this.switchState[i];
            ctx.fillStyle = '#fff';
            const knobX = on ? this.x + this.w - 25 : this.x + 15;
            ctx.fillRect(knobX, cy - 6, 10, 12);
            ctx.fillStyle = '#9ca3af';
            ctx.textAlign = 'right';
            ctx.fillText(i, this.x - 4, cy);
        }

        this.drawPins(ctx);
    }
}

ComponentRegistry.register('DIP_SWITCH', DipSwitchComponent);
