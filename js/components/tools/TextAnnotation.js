/**
 * Resizable canvas text annotation (`TEXT`) component.
 */
class TextAnnotationComponent extends BaseComponent {
    constructor(type, x, y, id) {
        super(type, x, y, id);
        this.text = 'Double Click to Edit';
        this.fontSize = 16;
        this.color = '#e0e0e0';
        this.w = 150;
        this.h = 20;
        this.inputs = [];
        this.outputs = [];
        this.resizable = true;
    }

    resetInputs() {}
    setInput() {}
    checkShorts() { return -1; }

    draw(ctx, isSelected) {
        if (isSelected) {
            ctx.strokeStyle = '#60a5fa';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 2]);
            ctx.strokeRect(this.x, this.y, this.w, this.h);
            ctx.setLineDash([]);
            ctx.fillStyle = '#60a5fa';
            ctx.fillRect(this.x + this.w - 6, this.y + this.h - 6, 6, 6);
        }
        ctx.font = `${this.fontSize}px sans-serif`;
        ctx.fillStyle = this.color;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(this.text, this.x, this.y);
        const metrics = ctx.measureText(this.text);
        this.w = metrics.width;
        this.h = this.fontSize;
    }
}

ComponentRegistry.register('TEXT', TextAnnotationComponent);
