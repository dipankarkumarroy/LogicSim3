/**
 * Toggle Switch and Momentary Push Button input components.
 */
class SwitchComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.inputs = [];
        this.outputs = [0];
        this.w = 40;
        this.h = 40;
        this.color = '#2d3748';
        this.initIO();
    }

    toggle() {
        if (this.type === 'SWITCH') {
            this.state = !this.state;
        } else if (this.type === 'BUTTON') {
            this.state = true;
        }
    }

    calculate() {
        this.outputState[0] = this.state;
    }

    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;

        if (this.type === 'SWITCH') {
            ctx.fillStyle = this.state ? '#4ade80' : '#ef4444';
            ctx.beginPath();
            ctx.arc(cx, cy, 8, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = this.state ? '#ef4444' : '#991b1b';
            ctx.beginPath();
            ctx.arc(cx, cy, 10, 0, Math.PI * 2);
            ctx.fill();
        }

        this.drawPins(ctx);
    }
}

ComponentRegistry.register(['SWITCH', 'BUTTON'], SwitchComponent);
