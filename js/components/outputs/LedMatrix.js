/**
 * Configurable N x N multiplexed LED Matrix display component.
 * Rows (0..n-1) act as Anodes (active HIGH) and Columns (n..2n-1) act as Cathodes (active LOW).
 */
class LedMatrixComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.n = 8;
        this.color = '#4b5563';
        this.updateBits(this.n);
    }

    updateBits(n) {
        this.n = typeof n === 'number' && n > 0 ? n : (this.n || 8);
        this.bits = this.n;
        this.inputs = Array.from({ length: this.n * 2 }, (_, i) => i);
        this.outputs = [];
        this.w = Math.max(80, this.n * 20 + 20);
        this.h = this.w;
        this.initIO();
    }

    getLocalInputPos(index) {
        if (index < this.n) {
            const spacingY = this.h / (this.n + 1);
            return { x: this.x - 10, y: this.y + spacingY * (index + 1) };
        }
        const colIndex = index - this.n;
        const spacingX = this.w / (this.n + 1);
        return { x: this.x + spacingX * (colIndex + 1), y: this.y + this.h + 10 };
    }

    draw(ctx, isSelected) {
        const spacingX = this.w / (this.n + 1);
        const spacingY = this.h / (this.n + 1);

        ctx.fillStyle = this.color || '#4b5563';
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 15);
        ctx.fill();
        ctx.strokeStyle = isSelected ? '#60a5fa' : '#374151';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Physical pins
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < this.n; i++) {
            const py = this.y + spacingY * (i + 1);
            ctx.moveTo(this.x, py);
            ctx.lineTo(this.x - 10, py);
        }
        for (let i = 0; i < this.n; i++) {
            const px = this.x + spacingX * (i + 1);
            ctx.moveTo(px, this.y + this.h);
            ctx.lineTo(px, this.y + this.h + 10);
        }
        ctx.stroke();

        // LED grid
        const ledRadius = (Math.min(spacingX, spacingY) / 2) - 3;
        for (let r = 0; r < this.n; r++) {
            for (let c = 0; c < this.n; c++) {
                const cx = this.x + spacingX * (c + 1);
                const cy = this.y + spacingY * (r + 1);
                const rowVal = this.inputState ? this.inputState[r] : 0;
                const colVal = this.inputState ? this.inputState[this.n + c] : 1;

                const isRowHigh = rowVal === 1 || rowVal === true || rowVal === '1';
                const isColLow = colVal === 0 || colVal === false || colVal === '0';
                const isOn = isRowHigh && isColLow;

                ctx.beginPath();
                ctx.arc(cx, cy, ledRadius, 0, Math.PI * 2);
                ctx.fillStyle = isOn ? '#ef4444' : '#111827';
                ctx.fill();

                if (isOn) {
                    ctx.shadowColor = '#ef4444';
                    ctx.shadowBlur = 10;
                    ctx.fill();
                    ctx.shadowBlur = 0;
                }
            }
        }

        // Pin labels
        ctx.fillStyle = '#d1d5db';
        ctx.font = '10px monospace';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i < this.n; i++) {
            ctx.fillText(`A${i}`, this.x - 14, this.y + spacingY * (i + 1));
        }

        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        for (let i = 0; i < this.n; i++) {
            ctx.fillText(`C${i}`, this.x + spacingX * (i + 1), this.y + this.h + 14);
        }

        ctx.lineWidth = 1;
    }
}

ComponentRegistry.register('LED_MATRIX', LedMatrixComponent);
