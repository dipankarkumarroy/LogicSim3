/**
 * Configurable 1-to-2^N Demultiplexer component.
 */
class DemultiplexerComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.w = 60;
        this.color = '#6d28d9';
        this.updateBits(2);
    }

    updateBits(n) {
        this.bits = n;
        const numOutputs = Math.pow(2, n);
        // Index 0 is Data, Index 1..n are Select
        this.inputs = Array.from({ length: 1 + n }, (_, i) => i);
        this.outputs = Array.from({ length: numOutputs }, (_, i) => i);
        this.h = Math.max(60, numOutputs * 15);
        this.initIO();
    }

    calculate() {
        const numOutputs = Math.pow(2, this.bits);
        let sel = 0;
        for (let i = 0; i < this.bits; i++) {
            if (this.inputState[1 + i]) sel |= (1 << i);
        }
        for (let i = 0; i < numOutputs; i++) {
            this.outputState[i] = 0;
        }
        this.outputState[sel] = this.inputState[0];
    }

    getLocalInputPos(index) {
        if (index === 0) {
            return { x: this.x - 10, y: this.y + this.h / 2 };
        }
        const selIndex = index - 1;
        const step = this.w / (this.bits + 1);
        return { x: this.x + step * (this.bits - selIndex), y: this.y + this.h + 10 };
    }

    getLocalOutputPos(index) {
        const numOutputs = Math.pow(2, this.bits);
        const step = this.h / (numOutputs + 1);
        return { x: this.x + this.w + 10, y: this.y + step * (index + 1) };
    }

    draw(ctx, isSelected) {
        this.w = Math.max(40, this.bits * 20 + 20);
        this.drawBoxBody(ctx, isSelected);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DEMUX', this.x + this.w / 2, this.y + 15);

        const numOutputs = Math.pow(2, this.bits);
        ctx.font = '10px monospace';

        ctx.textAlign = 'left';
        const inPos = this.getLocalInputPos(0);
        ctx.fillText('D', this.x + 2, inPos.y);

        ctx.textAlign = 'right';
        for (let i = 0; i < numOutputs; i++) {
            const outPos = this.getLocalOutputPos(i);
            ctx.fillText(i, this.x + this.w - 2, outPos.y);
        }

        ctx.textAlign = 'center';
        ctx.strokeStyle = isSelected ? '#60a5fa' : '#a0aec0';
        for (let i = 0; i < this.bits; i++) {
            const pos = this.getLocalInputPos(1 + i);
            ctx.fillText('S' + i, pos.x, this.y + this.h - 2);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x, this.y + this.h);
            ctx.stroke();
        }

        this.drawPins(ctx, (i) => i > 0);
    }
}

ComponentRegistry.register('DEMULTIPLEXER', DemultiplexerComponent);
