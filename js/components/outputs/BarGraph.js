/**
 * Multi-segment LED Bar Graph display component.
 */
class BarGraphComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.w = 40;
        this.color = '#18181b';
        this.updateBits(10);
    }

    updateBits(n) {
        this.bits = n;
        this.inputs = Array.from({ length: n }, (_, i) => i);
        this.outputs = [];
        this.h = Math.max(40, n * 15);
        this.initIO();
    }

    getLocalInputPos(index) {
        const step = this.h / this.bits;
        return { x: this.x - 10, y: this.y + step * index + step / 2 };
    }

    draw(ctx, isSelected) {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = isSelected ? '#60a5fa' : '#3f3f46';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        const ledH = this.h / this.bits;
        const pad = 4;
        for (let i = 0; i < this.bits; i++) {
            const y = this.y + i * ledH;
            const active = this.inputState[i];
            ctx.fillStyle = active ? '#ef4444' : '#450a0a';
            ctx.fillRect(this.x + pad, y + pad, this.w - pad * 2, ledH - pad * 2);
            if (active) {
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.fillRect(this.x + pad + 2, y + pad + 2, this.w - pad * 2 - 4, ledH - pad * 2 - 4);
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = '#6b7280';
            ctx.font = '9px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(i, this.x + this.w / 2, y + ledH / 2);
        }

        this.drawPins(ctx);
    }
}

ComponentRegistry.register('BAR_GRAPH', BarGraphComponent);
