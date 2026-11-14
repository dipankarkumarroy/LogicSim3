/**
 * Rising-edge Toggle (T) Flip-Flop component.
 */
class TFlipFlopComponent extends FlipFlopBase {
    constructor(type, x, y, id) {
        super(type, x, y, id, {
            color: '#7c3aed',
            topLabel: 'T'
        });
    }

    calculate() {
        const t = this.inputState[0];
        const clk = this.inputState[1];

        if (clk && !this.lastClockState) {
            if (t) {
                this.state = !this.state;
            }
            this.syncOutputs();
        }
        this.lastClockState = clk;
    }
}

ComponentRegistry.register('T_FF', TFlipFlopComponent);
