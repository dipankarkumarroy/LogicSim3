/**
 * Base class for all logic simulator components.
 * Provides shared port/state management, contention checking, and pin rendering helpers.
 */
class BaseComponent {
    /**
     * @param {string} type - Component type identifier.
     * @param {number} x - World X position.
     * @param {number} y - World Y position.
     * @param {string} id - Unique component ID.
     */
    constructor(type, x, y, id) {
        this.type = type;
        this.name = type;
        this.x = x;
        this.y = y;
        this.id = id;
        this.w = 60;
        this.h = 40;
        this.rotation = 0;
        this.state = false;
        this.frequency = 1;
        this.lastToggle = 0;
        this.interval = 500;
        this.resizable = false;
        this.showLabel = true;
        this.bits = 4;
        this.pins = 14;
        this.lastClockState = false;

        this.lastEdgeTime = 0;
        this.frequencyDisplay = "0 Hz";
        this.lastEdgeTimes = new Array(16).fill(0);
        this.frequencies = new Array(16).fill("0 Hz");

        this.inputs = [];
        this.outputs = [];
        this.color = '#4a5568';
        this.inputState = [];
        this.inputContention = [];
        this.outputState = [];
    }

    /**
     * Initializes input and output state buffers based on current inputs/outputs arrays.
     */
    initIO() {
        this.resetInputs();
        this.outputState = new Array(this.outputs.length).fill(false);
    }

    /**
     * Updates the bit width for configurable components.
     * Subclasses with variable bit widths override this method.
     * @param {number} n
     */
    updateBits(n) {
        this.bits = n;
        this.initIO();
    }

    /**
     * Resets input signal levels and contention tracking before each simulation step.
     */
    resetInputs() {
        this.inputState = new Array(this.inputs.length).fill(false);
        this.inputContention = Array.from(
            { length: this.inputs.length },
            () => ({ hasHigh: false, hasLow: false })
        );
    }

    /**
     * Applies a signal value to an input pin and records high/low drive for short detection.
     * @param {number} index
     * @param {boolean} val
     */
    setInput(index, val) {
        this.inputState[index] = this.inputState[index] || val;
        if (val === true) this.inputContention[index].hasHigh = true;
        if (val === false) this.inputContention[index].hasLow = true;
    }

    /**
     * Returns the first input pin index experiencing both HIGH and LOW drive, or -1 if none.
     * @returns {number}
     */
    checkShorts() {
        for (let i = 0; i < this.inputs.length; i++) {
            if (this.inputContention[i].hasHigh && this.inputContention[i].hasLow) {
                return i;
            }
        }
        return -1;
    }

    /**
     * Returns the current logic output state at the given output pin index.
     * @param {number} index
     * @returns {boolean}
     */
    getOutput(index) {
        return this.outputState[index];
    }

    /**
     * Handles interactive click/tap toggling on the component.
     * @param {{x: number, y: number}} [pos]
     */
    toggle(pos) {}

    /**
     * Computes component outputs from current inputs and internal state.
     */
    calculate() {}

    /**
     * Formats a frequency value in Hz for instrument displays.
     * @param {number} hz
     * @returns {string}
     */
    formatFreq(hz) {
        if (hz < 1) return "<1Hz";
        if (hz >= 1000000) return (hz / 1000000).toFixed(1) + "MHz";
        if (hz >= 1000) return (hz / 1000).toFixed(1) + "kHz";
        return Math.round(hz) + "Hz";
    }

    /**
     * Rotates the component by `delta` degrees (snapped to 0/90/180/270).
     * @param {number} [delta=90]
     */
    rotate(delta = 90) {
        this.rotation = ((this.rotation + delta) % 360 + 360) % 360;
    }

    /**
     * Converts a point from this component's unrotated local space to world coordinates.
     * @param {{x: number, y: number}} p
     * @returns {{x: number, y: number}}
     */
    localToWorld(p) {
        const rot = ((this.rotation || 0) % 360 + 360) % 360;
        if (rot === 0) return { x: p.x, y: p.y };
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;
        const dx = p.x - cx;
        const dy = p.y - cy;
        if (rot === 90) return { x: cx - dy, y: cy + dx };
        if (rot === 180) return { x: cx - dx, y: cy - dy };
        if (rot === 270) return { x: cx + dy, y: cy - dx };
        const rad = (rot * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
    }

    /**
     * Converts a point from world coordinates into this component's unrotated local space.
     * @param {{x: number, y: number}} p
     * @returns {{x: number, y: number}}
     */
    worldToLocal(p) {
        const rot = ((this.rotation || 0) % 360 + 360) % 360;
        if (rot === 0) return { x: p.x, y: p.y };
        const cx = this.x + this.w / 2;
        const cy = this.y + this.h / 2;
        const dx = p.x - cx;
        const dy = p.y - cy;
        if (rot === 90) return { x: cx + dy, y: cy - dx };
        if (rot === 180) return { x: cx - dx, y: cy - dy };
        if (rot === 270) return { x: cx - dy, y: cy + dx };
        const rad = (-rot * Math.PI) / 180;
        const cos = Math.cos(rad);
        const sin = Math.sin(rad);
        return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos };
    }

    /**
     * Returns the axis-aligned world-space bounding box accounting for rotation.
     * @returns {{x: number, y: number, w: number, h: number}}
     */
    getBounds() {
        const rot = ((this.rotation || 0) % 360 + 360) % 360;
        if (rot === 90 || rot === 270) {
            const cx = this.x + this.w / 2;
            const cy = this.y + this.h / 2;
            return { x: cx - this.h / 2, y: cy - this.w / 2, w: this.h, h: this.w };
        }
        return { x: this.x, y: this.y, w: this.w, h: this.h };
    }

    /**
     * Checks whether a world coordinate lies inside this component's bounding box.
     * @param {{x: number, y: number}} p
     * @returns {boolean}
     */
    isPointInside(p) {
        const lp = this.worldToLocal(p);
        return lp.x >= this.x && lp.x <= this.x + this.w && lp.y >= this.y && lp.y <= this.y + this.h;
    }

    /**
     * Returns the unrotated local position of an input pin.
     * @param {number} index
     * @returns {{x: number, y: number}}
     */
    getLocalInputPos(index) {
        const step = this.h / (this.inputs.length + 1);
        return { x: this.x - 10, y: this.y + step * (index + 1) };
    }

    /**
     * Returns the unrotated local position of an output pin.
     * @param {number} index
     * @returns {{x: number, y: number}}
     */
    getLocalOutputPos(index) {
        const step = this.h / (this.outputs.length + 1);
        return { x: this.x + this.w + 10, y: this.y + step * (index + 1) };
    }

    /**
     * Returns the world position of an input pin.
     * @param {number} index
     * @returns {{x: number, y: number}}
     */
    getInputPos(index) {
        return this.localToWorld(this.getLocalInputPos(index));
    }

    /**
     * Returns the world position of an output pin.
     * @param {number} index
     * @returns {{x: number, y: number}}
     */
    getOutputPos(index) {
        return this.localToWorld(this.getLocalOutputPos(index));
    }

    /**
     * Sets default fill/stroke styles before drawing.
     * @param {CanvasRenderingContext2D} ctx
     * @param {boolean} isSelected
     */
    applyBaseStyle(ctx, isSelected) {
        ctx.fillStyle = isSelected ? '#4b5563' : this.color;
        ctx.strokeStyle = isSelected ? '#60a5fa' : '#a0aec0';
        ctx.lineWidth = 2;
    }

    /**
     * Draws a standard rectangular component body and optional resize handle.
     * @param {CanvasRenderingContext2D} ctx
     * @param {boolean} isSelected
     */
    drawBoxBody(ctx, isSelected) {
        this.applyBaseStyle(ctx, isSelected);
        ctx.fillRect(this.x, this.y, this.w, this.h);
        ctx.strokeRect(this.x, this.y, this.w, this.h);
        if (this.resizable) {
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(this.x + this.w - 8, this.y + this.h - 8, 8, 8);
        }
    }

    /**
     * Draws horizontal pin legs for inputs (on left) and outputs (on right).
     * @param {CanvasRenderingContext2D} ctx
     * @param {(index: number) => boolean} [skipInput] - Optional predicate to skip specific input pins.
     */
    drawPins(ctx, skipInput = null) {
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;
        this.inputs.forEach((_, i) => {
            if (skipInput && skipInput(i)) return;
            const pos = this.getLocalInputPos(i);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x + 10, pos.y);
            ctx.stroke();
        });
        this.outputs.forEach((_, i) => {
            const pos = this.getLocalOutputPos(i);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineTo(pos.x - 10, pos.y);
            ctx.stroke();
        });
    }

    /**
     * Draws the component on the canvas.
     * @param {CanvasRenderingContext2D} ctx
     * @param {boolean} isSelected
     */
    draw(ctx, isSelected) {
        this.drawBoxBody(ctx, isSelected);
        this.drawPins(ctx);
    }
}
