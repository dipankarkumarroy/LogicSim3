/**
 * Configurable 2^N-to-1 Multiplexer component.
 */
class MultiplexerComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.w = 60;
        this.color = '#7c3aed';
        this.updateBits(2);
    }

    updateBits(n) {
        this.bits = n;
        const numInputs = Math.pow(2, n);
        // Inputs: 0..numInputs-1 are Data, numInputs..numInputs+n-1 are Select
        this.inputs = Array.from({ length: numInputs + n }, (_, i) => i);
        this.outputs = [0];
        this.h = Math.max(60, numInputs * 15);
        this.initIO();
    }

    calculate() {
        const numInputs = Math.pow(2, this.bits);
        let sel = 0;
        for (let i = 0; i < this.bits; i++) {
            if (this.inputState[numInputs + i]) sel |= (1 << i);
        }
        this.outputState[0] = this.inputState[sel];
    }

    getLocalInputPos(index) {
        const numInputs = Math.pow(2, this.bits);
        if (index < numInputs) {
            const step = this.h / (numInputs + 1);
            return { x: this.x - 10, y: this.y + step * (index + 1) };
        }
        const selIndex = index - numInputs;
        const step = this.w / (this.bits + 1);
        return { x: this.x + step * (this.bits - selIndex), y: this.y + this.h + 10 };
    }

    getLocalOutputPos() {
        return { x: this.x + this.w + 10, y: this.y + this.h / 2 };
    }

    draw(ctx, isSelected) {
        this.w = Math.max(40, this.bits * 20 + 20);
        this.drawBoxBody(ctx, isSelected);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MUX', this.x + this.w / 2, this.y + 15);

        const numInputs = Math.pow(2, this.bits);
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        for (let i = 0; i < numInputs; i++) {
            const pos = this.getLocalInputPos(i);
            ctx.fillText(i, this.x + 2, pos.y);
        }

        ctx.textAlign = 'center';
        ctx.strokeStyle = isSelected ? '#60a5fa' : '#a0aec0';
        for (let i = 0; i < this.bits; i++) {
            const pos = this.getLocalInputPos(numInputs + i);
            ctx.fillText('S' + i, pos.x, this.y + this.h - 2);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x, this.y + this.h);
            ctx.stroke();
        }

        this.drawPins(ctx, (i) => i >= numInputs);
    }
}

ComponentRegistry.register('MULTIPLEXER', MultiplexerComponent);
