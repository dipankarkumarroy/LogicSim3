/**
 * Rising-edge SR Flip-Flop component.
 */
class SRFlipFlopComponent extends FlipFlopBase {
    constructor(type, x, y, id) {
        super(type, x, y, id, {
            color: '#c2410c',
            topLabel: 'S',
            bottomLabel: 'R'
        });
    }

    calculate() {
        const s = this.inputState[0];
        const clk = this.inputState[1];
        const r = this.inputState[2];

        if (clk && !this.lastClockState) {
            if (s && !r) {
                this.state = true;
            } else if (!s && r) {
                this.state = false;
            }
            this.syncOutputs();
        }
        this.lastClockState = clk;
    }
}

ComponentRegistry.register('SR_FF', SRFlipFlopComponent);
