/**
 * Multi-bit binary digit readout display component (`BITS_OUT`).
 */
class BitsOutComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.h = 40;
        this.color = '#ffffff';
        this.updateBits(4);
    }

    updateBits(n) {
        this.bits = n;
        this.inputs = Array.from({ length: n }, (_, i) => i);
        this.outputs = [];
        this.w = Math.max(40, n * 35);
        this.initIO();
    }

    getLocalInputPos(index) {
        const boxW = this.w / this.bits;
        const visualIndex = (this.bits - 1) - index;
        return {
            x: this.x + visualIndex * boxW + boxW / 2,
            y: this.y - 10
        };
    }

    draw(ctx, isSelected) {
        const boxW = this.w / this.bits;
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#3f3f46';
        ctx.beginPath();

        for (let i = 0; i < this.bits; i++) {
            const pinX = this.x + i * boxW + boxW / 2;
            ctx.moveTo(pinX, this.y);
            ctx.lineTo(pinX, this.y - 10);
        }
        ctx.stroke();

        for (let i = 0; i < this.bits; i++) {
            const visualIndex = (this.bits - 1) - i;
            const x = this.x + visualIndex * boxW;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, this.y, boxW, this.h);
            ctx.strokeStyle = isSelected ? '#60a5fa' : '#000000';
            ctx.strokeRect(x, this.y, boxW, this.h);

            const active = this.inputState[i];
            ctx.fillStyle = '#000000';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(active ? '1' : '0', x + boxW / 2, this.y + this.h / 2);

            if (this.bits > 1) {
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#b7b4b4';
                if (i === 0) {
                    ctx.fillText('LSB', x + boxW / 2, this.y + this.h + 12);
                }
                if (i === this.bits - 1) {
                    ctx.fillText('MSB', x + boxW / 2, this.y + this.h + 12);
                }
            }
        }
    }
}

ComponentRegistry.register('BITS_OUT', BitsOutComponent);
