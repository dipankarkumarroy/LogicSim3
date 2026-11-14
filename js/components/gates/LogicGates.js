const GATE_OPERATIONS = {
    AND: (a, b) => a && b,
    OR: (a, b) => a || b,
    NOT: (a) => !a,
    NAND: (a, b) => !(a && b),
    NOR: (a, b) => !(a || b),
    XOR: (a, b) => (a ? !b : b),
    XNOR: (a, b) => a === b
};

/**
 * Standard boolean logic gates: AND, OR, NOT, NAND, NOR, XOR, XNOR.
 */
class LogicGateComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        if (type === 'NOT') {
            this.inputs = [0];
            this.w = 40;
        } else {
            this.inputs = [0, 1];
        }
        this.outputs = [0];
        this.color = '#4a5568';
        this.initIO();
    }

    calculate() {
        const op = GATE_OPERATIONS[this.type];
        if (op) {
            this.outputState[0] = op(this.inputState[0], this.inputState[1]);
        }
    }

    /**
     * Draws an inversion bubble at the output tip of inverted gates.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} cx
     * @param {number} cy
     * @param {number} radius
     * @param {boolean} isSelected
     */
    drawInversionBubble(ctx, cx, cy, radius, isSelected) {
        ctx.beginPath();
        ctx.fillStyle = isSelected ? '#4b5563' : this.color;
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Draws an OR-style curved gate body between startX and tipX.
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} startX
     * @param {number} bodyW
     * @param {number} tipX
     */
    drawCurvedGateBody(ctx, startX, bodyW, tipX) {
        const my = this.y;
        const mh = this.h;
        ctx.beginPath();
        ctx.moveTo(startX, my);
        ctx.quadraticCurveTo(startX + bodyW * 0.6, my, tipX, my + mh / 2);
        ctx.quadraticCurveTo(startX + bodyW * 0.6, my + mh, startX, my + mh);
        ctx.quadraticCurveTo(startX + bodyW * 0.25, my + mh / 2, startX, my);
        ctx.fill();
        ctx.stroke();
    }

    draw(ctx, isSelected) {
        this.applyBaseStyle(ctx, isSelected);
        const mx = this.x;
        const my = this.y;
        const mw = this.w;
        const mh = this.h;

        if (this.type === 'AND') {
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + mw / 2, my);
            ctx.arc(mx + 9 + mw / 2, my + mh / 2, mh / 2, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(mx, my + mh);
            ctx.lineTo(mx, my);
            ctx.fill();
            ctx.stroke();
        } else if (this.type === 'NAND') {
            const bubbleR = 3;
            const neck = 4;
            const bodyW = mw - (bubbleR * 2) - neck;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + bodyW / 2, my);
            ctx.arc(mx + 7 + bodyW / 2, my + mh / 2, mh / 2, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(mx, my + mh);
            ctx.lineTo(mx, my);
            ctx.fill();
            ctx.stroke();
            const tipX = mx + bodyW / 2 + mh / 2;
            this.drawInversionBubble(ctx, tipX + 4 + neck + bubbleR, my + mh / 2, bubbleR, isSelected);
        } else if (this.type === 'OR') {
            this.drawCurvedGateBody(ctx, mx, mw, mx + mw);
        } else if (this.type === 'NOR') {
            const bubbleR = 3;
            const neck = 4;
            const bodyW = mw - (bubbleR * 2) - neck;
            this.drawCurvedGateBody(ctx, mx, bodyW, mx + 5 + bodyW);
            this.drawInversionBubble(ctx, mx + bodyW + neck + bubbleR, my + mh / 2, bubbleR, isSelected);
        } else if (this.type === 'XOR') {
            const gap = 6;
            const bodyStart = mx + gap;
            const bodyW = mw - gap;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.quadraticCurveTo(mx + mw * 0.25, my + mh / 2, mx, my + mh);
            ctx.stroke();
            this.drawCurvedGateBody(ctx, bodyStart, bodyW, mx + mw);
        } else if (this.type === 'XNOR') {
            const gap = 6;
            const bubbleR = 3;
            const neck = 4;
            const totalBodyW = mw - gap - (bubbleR * 2) - neck;
            const bodyStart = mx + gap;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.quadraticCurveTo(mx + mw * 0.25, my + mh / 2, mx, my + mh);
            ctx.stroke();
            this.drawCurvedGateBody(ctx, bodyStart, totalBodyW, bodyStart + 5 + totalBodyW);
            this.drawInversionBubble(ctx, bodyStart + totalBodyW + neck + bubbleR, my + mh / 2, bubbleR, isSelected);
        } else if (this.type === 'NOT') {
            const bubbleR = 3;
            const neck = 3;
            const bodyW = mw - (bubbleR * 2) - neck;
            ctx.beginPath();
            ctx.moveTo(mx, my);
            ctx.lineTo(mx + 5 + bodyW, my + mh / 2);
            ctx.lineTo(mx, my + mh);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            this.drawInversionBubble(ctx, mx + bodyW + neck + bubbleR, my + mh / 2, bubbleR, isSelected);
        }

        this.drawPins(ctx);
    }
}

ComponentRegistry.register(Object.keys(GATE_OPERATIONS), LogicGateComponent);
