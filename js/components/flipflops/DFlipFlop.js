/**
 * Rising-edge D Flip-Flop (`D_FF`) and D Flip-Flop with Asynchronous Reset (`D_FF_R`).
 */
class DFlipFlopComponent extends FlipFlopBase {
    constructor(type, x, y, id) {
        const hasReset = type === 'D_FF_R';
        super(type, x, y, id, {
            color: '#4c1d95',
            topLabel: 'D',
            bottomLabel: hasReset ? 'R' : null
        });
    }

    calculate() {
        const d = this.inputState[0];
        const clk = this.inputState[1];
        const rst = this.isThreeInput ? this.inputState[2] : false;

        if (rst) {
            this.state = false;
            this.syncOutputs();
            this.lastClockState = clk;
            return;
        }

        if (clk && !this.lastClockState) {
            this.state = d;
            this.syncOutputs();
        }
        this.lastClockState = clk;
    }
}

ComponentRegistry.register(['D_FF', 'D_FF_R'], DFlipFlopComponent);
