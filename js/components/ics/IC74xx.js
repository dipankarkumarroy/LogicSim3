const QUAD_GATE_INPUTS = [0, 1, 3, 4, 8, 9, 11, 12, 6, 13];
const QUAD_GATE_OUTPUTS = [2, 5, 7, 10];

const QUAD_GATE_OPS = {
    '7408': (a, b) => a && b,
    '7432': (a, b) => a || b,
    '7400': (a, b) => !(a && b),
    '7486': (a, b) => (a ? !b : b)
};

const IC74XX_SPECS = {
    '7400': { pins: 14, w: 120, inputs: QUAD_GATE_INPUTS, outputs: QUAD_GATE_OUTPUTS },
    '7408': { pins: 14, w: 120, inputs: QUAD_GATE_INPUTS, outputs: QUAD_GATE_OUTPUTS },
    '7432': { pins: 14, w: 120, inputs: QUAD_GATE_INPUTS, outputs: QUAD_GATE_OUTPUTS },
    '7486': { pins: 14, w: 120, inputs: QUAD_GATE_INPUTS, outputs: QUAD_GATE_OUTPUTS },
    '7402': {
        pins: 14, w: 120,
        inputs: [1, 2, 4, 5, 7, 8, 10, 11, 6, 13],
        outputs: [0, 3, 9, 12]
    },
    '7404': {
        pins: 14, w: 120,
        inputs: [0, 2, 4, 8, 10, 12, 6, 13],
        outputs: [1, 3, 5, 7, 9, 11]
    },
    '7483': {
        pins: 16, w: 120,
        inputs: [9, 10, 7, 6, 2, 3, 0, 15, 12, 11, 4],
        outputs: [8, 5, 1, 14, 13]
    },
    '74150': {
        pins: 24, w: 180,
        inputs: [7, 6, 5, 4, 3, 2, 1, 0, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 10, 8, 11, 23],
        outputs: [9]
    },
    '74151': {
        pins: 16, w: 120,
        inputs: [3, 2, 1, 0, 14, 13, 12, 11, 10, 9, 8, 6, 7, 15],
        outputs: [4, 5]
    }
};

/**
 * 74xx-series TTL DIP IC components (7400, 7402, 7404, 7408, 7432, 7483, 7486, 74150, 74151).
 */
class IC74xxComponent extends DIPComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        const spec = IC74XX_SPECS[type];
        this.pins = spec.pins;
        this.w = spec.w;
        this.inputs = [...spec.inputs];
        this.outputs = [...spec.outputs];
        this.initIO();
    }

    getPin(pinIndex) {
        const idx = this.inputs.indexOf(pinIndex);
        return idx !== -1 ? this.inputState[idx] : false;
    }

    calculate() {
        const gndIdx = this.inputs.length - 2;
        const vccIdx = this.inputs.length - 1;
        if (!this.inputContention[vccIdx].hasHigh || !this.inputContention[gndIdx].hasLow) {
            this.outputState.fill(false);
            return;
        }

        if (this.type === '7404') {
            [0, 2, 4, 8, 10, 12].forEach((pin, idx) => {
                this.outputState[idx] = !this.getPin(pin);
            });
            return;
        }

        if (this.type === '7402') {
            [[1, 2], [4, 5], [7, 8], [10, 11]].forEach(([a, b], idx) => {
                this.outputState[idx] = !(this.getPin(a) || this.getPin(b));
            });
            return;
        }

        if (this.type === '7483') {
            const a = (this.inputState[0] ? 1 : 0) | (this.inputState[2] ? 2 : 0) |
                      (this.inputState[4] ? 4 : 0) | (this.inputState[6] ? 8 : 0);
            const b = (this.inputState[1] ? 1 : 0) | (this.inputState[3] ? 2 : 0) |
                      (this.inputState[5] ? 4 : 0) | (this.inputState[7] ? 8 : 0);
            const c0 = this.inputState[8] ? 1 : 0;
            const sum = a + b + c0;
            for (let i = 0; i < 5; i++) {
                this.outputState[i] = (sum & (1 << i)) !== 0;
            }
            return;
        }

        if (this.type === '74150') {
            const g = this.getPin(9);
            if (g) {
                this.outputState[0] = true;
            } else {
                const sel = (this.getPin(14) ? 1 : 0) + (this.getPin(13) ? 2 : 0) +
                            (this.getPin(12) ? 4 : 0) + (this.getPin(10) ? 8 : 0);
                this.outputState[0] = !this.inputState[sel];
            }
            return;
        }

        if (this.type === '74151') {
            const g = this.getPin(7);
            if (g) {
                this.outputState[0] = false;
                this.outputState[1] = true;
            } else {
                const sel = (this.getPin(10) ? 1 : 0) + (this.getPin(9) ? 2 : 0) + (this.getPin(8) ? 4 : 0);
                const val = this.inputState[sel];
                this.outputState[0] = val;
                this.outputState[1] = !val;
            }
            return;
        }

        const gateOp = QUAD_GATE_OPS[this.type];
        if (gateOp) {
            this.outputState[0] = gateOp(this.getPin(0), this.getPin(1));
            this.outputState[1] = gateOp(this.getPin(3), this.getPin(4));
            this.outputState[2] = gateOp(this.getPin(8), this.getPin(9));
            this.outputState[3] = gateOp(this.getPin(11), this.getPin(12));
        }
    }
}

ComponentRegistry.register(Object.keys(IC74XX_SPECS), IC74xxComponent);
