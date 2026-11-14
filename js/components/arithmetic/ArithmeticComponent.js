const ARITHMETIC_SPECS = {
    HALF_ADDER: { inputs: 2, outputs: 2, w: 80, h: 60 },
    HALF_SUB:   { inputs: 2, outputs: 2, w: 80, h: 60 },
    FULL_ADDER: { inputs: 3, outputs: 2, w: 80, h: 80 },
    FULL_SUB:   { inputs: 3, outputs: 2, w: 80, h: 80 },
    ADDER_4BIT: { inputs: 9, outputs: 5, w: 120, h: 140 },
    SUB_4BIT:   { inputs: 9, outputs: 5, w: 120, h: 140 },
    ADDER_8BIT: { inputs: 17, outputs: 9, w: 120, h: 240 },
    SUB_8BIT:   { inputs: 17, outputs: 9, w: 120, h: 240 },
    MUL_2BIT:   { inputs: 4, outputs: 4, w: 80, h: 80 },
    MUL_4BIT:   { inputs: 8, outputs: 8, w: 100, h: 160 },
    DIV_4BIT:   { inputs: 8, outputs: 8, w: 100, h: 160 }
};

/**
 * Arithmetic components: Half/Full Adders & Subtractors, N-bit Adders/Subtractors, Multipliers, Divider.
 */
class ArithmeticComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        const spec = ARITHMETIC_SPECS[type];
        this.color = '#2e1065';
        this.w = spec.w;
        this.h = spec.h;
        this.inputs = Array.from({ length: spec.inputs }, (_, i) => i);
        // Preserve legacy output index arrays for half/full components
        if (type === 'HALF_ADDER' || type === 'HALF_SUB') {
            this.outputs = [2, 3];
        } else if (type === 'FULL_ADDER' || type === 'FULL_SUB') {
            this.outputs = [3, 4];
        } else {
            this.outputs = Array.from({ length: spec.outputs }, (_, i) => i);
        }
        this.initIO();
    }

    /**
     * Reads an unsigned integer from a contiguous range of input pins (LSB first).
     * @param {number} start
     * @param {number} bitCount
     * @returns {number}
     */
    readBus(start, bitCount) {
        let val = 0;
        for (let i = 0; i < bitCount; i++) {
            if (this.inputState[start + i]) val |= (1 << i);
        }
        return val;
    }

    /**
     * Writes an unsigned integer to a contiguous range of output pins (LSB first).
     * @param {number} start
     * @param {number} bitCount
     * @param {number} value
     */
    writeBus(start, bitCount, value) {
        for (let i = 0; i < bitCount; i++) {
            this.outputState[start + i] = ((value >> i) & 1) === 1;
        }
    }

    calculate() {
        const isSub = this.type.includes('SUB');
        const isHalf = this.type.includes('HALF');
        const isFull = this.type.includes('FULL');
        const isMul = this.type.includes('MUL');
        const isDiv = this.type.includes('DIV');

        if (isHalf) {
            const a = this.inputState[0];
            const b = this.inputState[1];
            this.outputState[0] = (a ^ b) === 1;
            this.outputState[1] = isSub ? (!a && b) : (a && b);
            return;
        }
        if (isFull) {
            const a = this.inputState[0];
            const b = this.inputState[1];
            const c = this.inputState[2];
            this.outputState[0] = (a ^ b ^ c) === 1;
            this.outputState[1] = isSub
                ? ((!a && b) || (c && !(a ^ b)))
                : ((a && b) || (c && (a ^ b)));
            return;
        }
        if (isMul) {
            const bits = this.type.includes('4BIT') ? 4 : 2;
            const res = this.readBus(0, bits) * this.readBus(bits, bits);
            this.writeBus(0, bits * 2, res);
            return;
        }
        if (isDiv) {
            const valA = this.readBus(0, 4);
            const valB = this.readBus(4, 4);
            if (valB === 0) {
                this.outputState.fill(false);
            } else {
                this.writeBus(0, 4, Math.floor(valA / valB));
                this.writeBus(4, 4, valA % valB);
            }
            return;
        }

        const bits = this.type.includes('8BIT') ? 8 : 4;
        const valA = this.readBus(0, bits);
        const valB = this.readBus(bits, bits);
        const cin = this.inputState[bits * 2] ? 1 : 0;
        const res = isSub ? (valA - valB - cin) : (valA + valB + cin);
        this.writeBus(0, bits, res);
        this.outputState[bits] = isSub ? res < 0 : res >= (1 << bits);
    }

    getInputLabel(i) {
        if (this.type.includes('HALF')) return i === 0 ? 'A' : 'B';
        if (this.type.includes('FULL')) {
            if (i === 0) return 'A';
            if (i === 1) return 'B';
            return this.type.includes('ADD') ? 'Cin' : 'Bin';
        }
        if (this.type.includes('MUL')) {
            const b = this.type.includes('4BIT') ? 4 : 2;
            return i < b ? 'A' + i : 'B' + (i - b);
        }
        if (this.type.includes('DIV')) {
            return i < 4 ? 'A' + i : 'B' + (i - 4);
        }
        const b = this.type.includes('8BIT') ? 8 : 4;
        if (i < b) return 'A' + i;
        if (i < b * 2) return 'B' + (i - b);
        return this.type.includes('ADD') ? 'Cin' : 'Bin';
    }

    getOutputLabel(i) {
        if (this.type.includes('HALF') || this.type.includes('FULL')) {
            if (this.type.includes('ADD')) return i === 0 ? 'Sum' : 'Co';
            return i === 0 ? 'Diff' : 'Bo';
        }
        if (this.type.includes('MUL')) return 'P' + i;
        if (this.type.includes('DIV')) return i < 4 ? 'Q' + i : 'R' + (i - 4);
        const b = this.type.includes('8BIT') ? 8 : 4;
        if (i < b) return (this.type.includes('ADD') ? 'S' : 'D') + i;
        return this.type.includes('ADD') ? 'Co' : 'Bo';
    }

    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);
        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textBaseline = 'middle';

        ctx.textAlign = 'left';
        this.inputs.forEach((_, i) => {
            const pos = this.getLocalInputPos(i);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(this.x, pos.y);
            ctx.stroke();
            ctx.fillText(this.getInputLabel(i), this.x + 5, pos.y);
        });

        ctx.textAlign = 'right';
        this.outputs.forEach((_, i) => {
            const pos = this.getLocalOutputPos(i);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(this.x + this.w, pos.y);
            ctx.stroke();
            ctx.fillText(this.getOutputLabel(i), this.x + this.w - 5, pos.y);
        });
    }
}

ComponentRegistry.register(Object.keys(ARITHMETIC_SPECS), ArithmeticComponent);
