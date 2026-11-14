/**
 * Base class for Dual In-line Package (DIP) integrated circuit components.
 * Handles top/bottom pin layout and IC package rendering.
 */
class DIPComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.w = 120;
        this.h = 40;
        this.color = '#1f2937';
    }

    /**
     * Returns the unrotated local position of a 0-based DIP package pin.
     * Bottom row: 0 .. pins/2 - 1 (left to right); Top row: pins/2 .. pins - 1 (right to left).
     * @param {number} pinIndex
     * @returns {{x: number, y: number}}
     */
    getLocalPinPosDIP(pinIndex) {
        const pinsPerSide = this.pins / 2;
        const pinLength = 10;
        const spacing = this.w / (pinsPerSide + 1);

        if (pinIndex < pinsPerSide) {
            return { x: this.x + spacing * (pinIndex + 1), y: this.y + this.h + pinLength };
        }
        return { x: this.x + spacing * (this.pins - pinIndex), y: this.y - pinLength };
    }

    /**
     * Returns the world position of a 0-based DIP package pin.
     * @param {number} pinIndex
     * @returns {{x: number, y: number}}
     */
    getPinPosDIP(pinIndex) {
        return this.localToWorld(this.getLocalPinPosDIP(pinIndex));
    }

    getLocalInputPos(index) {
        return this.getLocalPinPosDIP(this.inputs[index]);
    }

    getLocalOutputPos(index) {
        return this.getLocalPinPosDIP(this.outputs[index]);
    }

    draw(ctx, isSelected) {
        ctx.fillStyle = isSelected ? '#374151' : '#1f2937';
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeStyle = isSelected ? '#60a5fa' : '#111';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.w, this.h);

        // Pin-1 orientation notch
        ctx.beginPath();
        ctx.arc(this.x, this.y + this.h / 2, 5, -Math.PI / 2, Math.PI / 2);
        ctx.fillStyle = '#111';
        ctx.fill();

        ctx.fillStyle = '#9ca3af';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (this.showLabel) {
            ctx.fillText(this.type, this.x + this.w / 2, this.y + this.h / 2);
        }

        const pinsPerSide = this.pins / 2;
        ctx.font = '10px monospace';

        for (let i = 0; i < this.pins; i++) {
            const tip = this.getLocalPinPosDIP(i);
            const isBottom = i < pinsPerSide;

            ctx.strokeStyle = '#9ca3af';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(tip.x, isBottom ? this.y + this.h : this.y);
            ctx.lineTo(tip.x, tip.y);
            ctx.stroke();

            ctx.fillStyle = '#d1d5db';
            ctx.fillRect(tip.x - 3, tip.y - 3, 6, 6);

            ctx.fillStyle = '#6b7280';
            if (isBottom) {
                ctx.textBaseline = 'bottom';
                ctx.fillText(i + 1, tip.x, this.y + this.h - 2);
            } else {
                ctx.textBaseline = 'top';
                ctx.fillText(i + 1, tip.x, this.y + 2);
            }
        }
    }
}
