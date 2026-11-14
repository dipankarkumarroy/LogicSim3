/**
 * 4-bit Hexadecimal 7-segment style numeric display component.
 */
class HexDisplayComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.inputs = [0, 1, 2, 3];
        this.outputs = [];
        this.w = 60;
        this.h = 80;
        this.color = '#000';
        this.hexValue = 0;
        this.initIO();
    }

    calculate() {
        let val = 0;
        if (this.inputState[0]) val += 1;
        if (this.inputState[1]) val += 2;
        if (this.inputState[2]) val += 4;
        if (this.inputState[3]) val += 8;
        this.hexValue = val;
    }

    getLocalInputPos(index) {
        const step = this.h / 5;
        return { x: this.x - 10, y: this.y + step * (index + 1) };
    }

    draw(ctx, isSelected) {
        this.applyBaseStyle(ctx, isSelected);
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        ctx.fillStyle = 'red';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.hexValue.toString(16).toUpperCase(), this.x + this.w / 2, this.y + this.h / 2);

        ctx.fillStyle = '#fff';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        const labels = ['1', '2', '4', '8'];
        for (let i = 0; i < 4; i++) {
            ctx.fillText(labels[i], this.x + 2, this.getLocalInputPos(i).y);
        }

        this.drawPins(ctx);
    }
}

ComponentRegistry.register('HEX_DISPLAY', HexDisplayComponent);
