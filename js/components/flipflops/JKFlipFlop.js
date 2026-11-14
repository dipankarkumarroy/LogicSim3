/**
 * Rising-edge JK Flip-Flop component.
 */
class JKFlipFlopComponent extends FlipFlopBase {
    constructor(type, x, y, id) {
        super(type, x, y, id, {
            color: '#be185d',
            topLabel: 'J',
            bottomLabel: 'K'
        });
    }

    calculate() {
        const j = this.inputState[0];
        const clk = this.inputState[1];
        const k = this.inputState[2];

        if (clk && !this.lastClockState) {
            if (j && !k) {
                this.state = true;
            } else if (!j && k) {
                this.state = false;
            } else if (j && k) {
                this.state = !this.state;
            }
            this.syncOutputs();
        }
        this.lastClockState = clk;
    }
}

ComponentRegistry.register('JK_FF', JKFlipFlopComponent);
