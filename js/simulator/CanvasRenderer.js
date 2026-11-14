/**
 * Renders the simulator grid, wires, components, selection box, and short-circuit indicators.
 */
const CanvasRenderer = {
    /**
     * Renders a complete frame on the simulator canvas.
     * @param {LogicSimulator} sim
     */
    draw(sim) {
        const ctx = sim.ctx;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, sim.canvas.width, sim.canvas.height);
        this.drawGrid(sim);

        ctx.setTransform(sim.scale, 0, 0, sim.scale, sim.offset.x, sim.offset.y);

        this.drawWires(sim);
        this.drawActiveWire(sim);
        this.drawComponents(sim);
        this.drawSelectionBox(sim);
        this.drawShortCircuitMarker(sim);
    },

    /**
     * Draws the background world-space coordinate grid.
     * @param {LogicSimulator} sim
     */
    drawGrid(sim) {
        const ctx = sim.ctx;
        const startX = -sim.offset.x / sim.scale;
        const startY = -sim.offset.y / sim.scale;
        const endX = (sim.canvas.width - sim.offset.x) / sim.scale;
        const endY = (sim.canvas.height - sim.offset.y) / sim.scale;
        const gridSize = 20;
        const gridStartX = Math.floor(startX / gridSize) * gridSize;
        const gridStartY = Math.floor(startY / gridSize) * gridSize;

        ctx.beginPath();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1 / sim.scale;
        ctx.setTransform(sim.scale, 0, 0, sim.scale, sim.offset.x, sim.offset.y);
        for (let x = gridStartX; x < endX; x += gridSize) {
            ctx.moveTo(x, startY);
            ctx.lineTo(x, endY);
        }
        for (let y = gridStartY; y < endY; y += gridSize) {
            ctx.moveTo(startX, y);
            ctx.lineTo(endX, y);
        }
        ctx.stroke();
    },

    drawWires(sim) {
        const ctx = sim.ctx;
        sim.wires.forEach((w) => {
            const start = w.startComp.getOutputPos(w.startIndex);
            const end = w.endComp.getInputPos(w.endIndex);
            const isSelected = sim.selectedWires.has(w);

            if (isSelected) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#3b82f6';
                ctx.strokeStyle = '#60a5fa';
                ctx.lineWidth = 5;
                this.drawOrthogonalWire(ctx, start, end, w.points);
                ctx.stroke();
                ctx.shadowBlur = 0;
            }

            ctx.lineWidth = 2;
            ctx.strokeStyle = w.state ? '#4ade80' : '#555';
            this.drawOrthogonalWire(ctx, start, end, w.points);
            ctx.stroke();

            ctx.fillStyle = w.state ? '#4ade80' : '#888';
            w.points.forEach((p) => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
                ctx.fill();
            });
        });
    },

    drawActiveWire(sim) {
        if (!sim.activeWire) return;
        const ctx = sim.ctx;
        const startPos = sim.activeWire.visualStart
            ? sim.activeWire.visualStart
            : sim.activeWire.startNode.component.getOutputPos(sim.activeWire.startNode.index);

        ctx.strokeStyle = '#ffffff88';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        this.drawOrthogonalWire(ctx, startPos, sim.mousePos, sim.activeWire.points);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#fff';
        sim.activeWire.points.forEach((p) => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        if (sim.activeWire.visualStart) {
            ctx.beginPath();
            ctx.fillStyle = '#0ff';
            ctx.arc(startPos.x, startPos.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }
    },

    drawComponents(sim) {
        const ctx = sim.ctx;
        sim.components.forEach((c) => {
            ctx.save();
            if (c.rotation) {
                const cx = c.x + c.w / 2;
                const cy = c.y + c.h / 2;
                ctx.translate(cx, cy);
                ctx.rotate((c.rotation * Math.PI) / 180);
                ctx.translate(-cx, -cy);
            }
            c.draw(ctx, sim.selectedComponents.has(c));
            ctx.restore();

            if (sim.globalLabelsVisible && c.showLabel && c.type !== 'TEXT' && !c.type.startsWith('74')) {
                const bounds = c.getBounds();
                ctx.fillStyle = '#9ca3af';
                ctx.font = '10px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'alphabetic';
                ctx.fillText(c.name, bounds.x + bounds.w / 2, bounds.y - 8);
            }
        });
    },

    drawSelectionBox(sim) {
        if (!sim.selectionBox) return;
        const ctx = sim.ctx;
        const x = Math.min(sim.selectionBox.start.x, sim.selectionBox.current.x);
        const y = Math.min(sim.selectionBox.start.y, sim.selectionBox.current.y);
        const w = Math.abs(sim.selectionBox.start.x - sim.selectionBox.current.x);
        const h = Math.abs(sim.selectionBox.start.y - sim.selectionBox.current.y);

        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1;
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);
    },

    drawShortCircuitMarker(sim) {
        if (!sim.shortCircuitPos) return;
        const ctx = sim.ctx;
        const p = sim.shortCircuitPos;
        ctx.beginPath();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 3;
        ctx.arc(p.x, p.y, 15, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.moveTo(p.x - 5, p.y - 8);
        ctx.lineTo(p.x + 5, p.y - 8);
        ctx.lineTo(p.x - 2, p.y);
        ctx.lineTo(p.x + 6, p.y);
        ctx.lineTo(p.x - 4, p.y + 10);
        ctx.lineTo(p.x + 2, p.y + 2);
        ctx.lineTo(p.x - 6, p.y + 2);
        ctx.fill();
    },

    /**
     * Traces an orthogonal (horizontal-then-vertical) wire path through waypoints.
     * @param {CanvasRenderingContext2D} ctx
     * @param {{x: number, y: number}} start
     * @param {{x: number, y: number}} end
     * @param {{x: number, y: number}[]} points
     */
    drawOrthogonalWire(ctx, start, end, points) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        let current = start;
        if (points && points.length > 0) {
            for (const p of points) {
                this.drawHVSegment(ctx, current, p);
                current = p;
            }
        }
        this.drawHVSegment(ctx, current, end);
    },

    /**
     * Draws a horizontal-then-vertical L-segment from p1 to p2.
     * @param {CanvasRenderingContext2D} ctx
     * @param {{x: number, y: number}} p1
     * @param {{x: number, y: number}} p2
     */
    drawHVSegment(ctx, p1, p2) {
        ctx.lineTo(p2.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
    }
};
