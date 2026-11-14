/**
 * Configurable N-to-2^N Binary Decoder component.
 */
class DecoderComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.w = 60;
        this.color = '#7c3aed';
        this.updateBits(2);
    }

    updateBits(n) {
        this.bits = n;
        const numOutputs = Math.pow(2, n);
        this.inputs = Array.from({ length: n }, (_, i) => i);
        this.outputs = Array.from({ length: numOutputs }, (_, i) => i);
        this.h = Math.max(60, numOutputs * 15);
        this.initIO();
    }

    calculate() {
        let val = 0;
        for (let i = 0; i < this.bits; i++) {
            if (this.inputState[i]) val |= (1 << i);
        }
        this.outputState.fill(false);
        this.outputState[val] = true;
    }

    getLocalInputPos(index) {
        const step = this.h / (this.bits + 1);
        return { x: this.x - 10, y: this.y + step * (index + 1) };
    }

    getLocalOutputPos(index) {
        const numOutputs = Math.pow(2, this.bits);
        const step = this.h / (numOutputs + 1);
        return { x: this.x + this.w + 10, y: this.y + step * (index + 1) };
    }

    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('DEC', this.x + this.w / 2, this.y + 15);

        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        for (let i = 0; i < this.bits; i++) {
            const pos = this.getLocalInputPos(i);
            ctx.fillText('A' + i, this.x + 2, pos.y);
        }

        const numOutputs = Math.pow(2, this.bits);
        ctx.textAlign = 'right';
        for (let i = 0; i < numOutputs; i++) {
            const pos = this.getLocalOutputPos(i);
            ctx.fillText(i, this.x + this.w - 2, pos.y);
        }

        this.drawPins(ctx);
    }
}

ComponentRegistry.register('DECODER', DecoderComponent);
