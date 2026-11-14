/**
 * Handles keyboard, mouse, touch, wheel, hit-testing, and wire-routing interactions on the canvas.
 */
class InputHandler {
    /**
     * @param {LogicSimulator} sim
     */
    constructor(sim) {
        this.sim = sim;
        this.lastTouchDist = 0;
        this.touchStartCenter = null;
        this.touchStartPos = null;
        this.longPressTimer = null;
        this.isTouchAction = false;
        this.lastTapTime = 0;
        this.lastTapPos = { x: 0, y: 0 };
    }

    setupEvents() {
        const sim = this.sim;

        window.addEventListener('resize', () => sim.resize());
        window.addEventListener('keydown', (e) => {
            const activeTag = document.activeElement ? document.activeElement.tagName : '';
            const isTyping = document.activeElement === sim.textInput ||
                activeTag === 'INPUT' || activeTag === 'TEXTAREA';

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (!isTyping) sim.deleteSelection();
            }
            if ((e.key === 'r' || e.key === 'R') && !e.ctrlKey && !e.metaKey && !e.altKey) {
                if (!isTyping) {
                    e.preventDefault();
                    sim.rotateSelection(e.shiftKey ? -90 : 90);
                }
            }
            if (e.key === 'Escape') {
                if (sim.activeWire) sim.activeWire = null;
                else sim.deselectAll();
            }
            if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) sim.copySelection();
            if (e.ctrlKey && (e.key === 'v' || e.key === 'V')) sim.pasteSelection();
            if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
                e.preventDefault();
                sim.undo();
            }
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
                e.preventDefault();
                sim.redo();
            }
        });

        const undoBtn = document.getElementById('undoBtn');
        if (undoBtn) undoBtn.addEventListener('click', () => sim.undo());
        const redoBtn = document.getElementById('redoBtn');
        if (redoBtn) redoBtn.addEventListener('click', () => sim.redo());

        sim.colorPicker.addEventListener('input', (e) => {
            if (sim.selectedComponents.size === 1) {
                const comp = Array.from(sim.selectedComponents)[0];
                if (comp.type === 'TEXT') {
                    sim.saveState();
                    comp.color = e.target.value;
                    sim.draw();
                }
            }
        });

        const finalizeTextEdit = () => {
            if (sim.textInput.style.display !== 'none') {
                const compId = sim.textInput.dataset.compId;
                const comp = sim.components.find((c) => c.id === compId);
                if (comp) {
                    sim.saveState();
                    if (comp.type === 'TEXT') {
                        comp.text = sim.textInput.value;
                    } else {
                        comp.name = sim.textInput.value;
                        comp.showLabel = true;
                    }
                    sim.draw();
                }
                sim.textInput.style.display = 'none';
            }
        };
        sim.textInput.addEventListener('blur', finalizeTextEdit);
        sim.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') finalizeTextEdit();
        });

        // Mouse events
        sim.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        sim.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        sim.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        sim.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        sim.canvas.addEventListener('dblclick', (e) => this.handleDblClick(e));
        sim.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (sim.activeWire) sim.activeWire = null;
            else sim.handleContextMenu(e);
        });

        // Touch events
        sim.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        sim.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        sim.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    }

    handleTouchStart(e) {
        const sim = this.sim;
        if (e.touches.length === 2) {
            e.preventDefault();
            sim.isPanning = true;
            this.lastTouchDist = this.getTouchDist(e.touches);
            this.touchStartCenter = this.getTouchCenter(e.touches);
            sim.panStart = { x: this.touchStartCenter.x, y: this.touchStartCenter.y };
            return;
        }

        if (e.touches.length === 1) {
            e.preventDefault();
            const touch = e.touches[0];
            this.touchStartPos = { x: touch.clientX, y: touch.clientY };

            const currentTime = new Date().getTime();
            const tapGap = currentTime - this.lastTapTime;
            const clickPos = { x: touch.clientX, y: touch.clientY };
            const dist = Math.hypot(clickPos.x - this.lastTapPos.x, clickPos.y - this.lastTapPos.y);

            if (tapGap < 300 && dist < 30) {
                if (sim.activeWire) {
                    sim.activeWire = null;
                    sim.draw();
                    this.lastTapTime = 0;
                    return;
                }
                this.handleDblClick({
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => {}
                });
                this.lastTapTime = 0;
                if (this.longPressTimer) clearTimeout(this.longPressTimer);
                return;
            }

            this.lastTapTime = currentTime;
            this.lastTapPos = clickPos;
            sim.mousePos = this.getMousePos({ clientX: touch.clientX, clientY: touch.clientY });

            this.handleMouseMove({
                preventDefault: () => {},
                clientX: touch.clientX,
                clientY: touch.clientY,
                shiftKey: false,
                ctrlKey: false
            });

            if (!sim.activeWire) {
                this.longPressTimer = setTimeout(() => {
                    sim.isDragging = false;
                    sim.dragTarget = null;
                    this.isTouchAction = false;

                    sim.handleContextMenu({
                        preventDefault: () => {},
                        clientX: touch.clientX,
                        clientY: touch.clientY,
                        pageX: touch.pageX,
                        pageY: touch.pageY
                    });
                }, 600);
            }

            this.isTouchAction = true;
            this.handleMouseDown({
                preventDefault: () => {},
                button: 0,
                clientX: touch.clientX,
                clientY: touch.clientY,
                shiftKey: false,
                ctrlKey: false
            });
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        const sim = this.sim;

        if (e.touches.length === 2 && sim.isPanning) {
            const center = this.getTouchCenter(e.touches);
            const dist = this.getTouchDist(e.touches);

            const dx = center.x - sim.panStart.x;
            const dy = center.y - sim.panStart.y;
            sim.offset.x += dx;
            sim.offset.y += dy;

            if (this.lastTouchDist > 0) {
                const scaleFactor = dist / this.lastTouchDist;
                const oldScale = sim.scale;
                const newScale = Math.max(0.1, Math.min(oldScale * scaleFactor, 5));

                const rect = sim.canvas.getBoundingClientRect();
                const mouseX = center.x - rect.left;
                const mouseY = center.y - rect.top;
                const worldX = (mouseX - sim.offset.x) / oldScale;
                const worldY = (mouseY - sim.offset.y) / oldScale;

                sim.scale = newScale;
                sim.offset.x = mouseX - worldX * newScale;
                sim.offset.y = mouseY - worldY * newScale;
            }

            this.lastTouchDist = dist;
            sim.panStart = center;
            sim.draw();
            return;
        }

        if (e.touches.length === 1) {
            const touch = e.touches[0];
            if (this.longPressTimer && this.touchStartPos) {
                const moveDist = Math.hypot(
                    touch.clientX - this.touchStartPos.x,
                    touch.clientY - this.touchStartPos.y
                );
                if (moveDist > 10) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
            }

            sim.mousePos = this.getMousePos({ clientX: touch.clientX, clientY: touch.clientY });
            this.handleMouseMove({
                preventDefault: () => {},
                clientX: touch.clientX,
                clientY: touch.clientY,
                shiftKey: false,
                ctrlKey: false
            });
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        if (e.touches.length < 2) {
            this.sim.isPanning = false;
        }
        if (this.isTouchAction) {
            this.handleMouseUp({
                preventDefault: () => {},
                button: 0,
                shiftKey: false,
                ctrlKey: false
            });
            this.isTouchAction = false;
        }
    }

    getTouchDist(touches) {
        return Math.hypot(
            touches[0].clientX - touches[1].clientX,
            touches[0].clientY - touches[1].clientY
        );
    }

    getTouchCenter(touches) {
        return {
            x: (touches[0].clientX + touches[1].clientX) / 2,
            y: (touches[0].clientY + touches[1].clientY) / 2
        };
    }

    handleWheel(e) {
        e.preventDefault();
        const sim = this.sim;
        if (e.ctrlKey) {
            const zoomIntensity = 0.1;
            const delta = -Math.sign(e.deltaY);
            const zoom = Math.exp(delta * zoomIntensity);
            const rect = sim.canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;
            const worldX = (screenX - sim.offset.x) / sim.scale;
            const worldY = (screenY - sim.offset.y) / sim.scale;
            sim.scale = Math.max(0.1, Math.min(sim.scale * zoom, 5));
            sim.offset.x = screenX - worldX * sim.scale;
            sim.offset.y = screenY - worldY * sim.scale;
        } else if (e.shiftKey) {
            sim.offset.x -= e.deltaY;
            sim.offset.x -= e.deltaX;
        } else {
            sim.offset.x -= e.deltaX;
            sim.offset.y -= e.deltaY;
        }
    }

    getMousePos(e) {
        const sim = this.sim;
        const rect = sim.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - sim.offset.x) / sim.scale,
            y: (e.clientY - rect.top - sim.offset.y) / sim.scale
        };
    }

    getHoverInfo(pos) {
        const sim = this.sim;
        if (sim.selectedComponents.size === 1) {
            const comp = Array.from(sim.selectedComponents)[0];
            if (comp.resizable) {
                const lp = comp.worldToLocal(pos);
                if (lp.x >= comp.x + comp.w - 15 && lp.x <= comp.x + comp.w &&
                    lp.y >= comp.y + comp.h - 15 && lp.y <= comp.y + comp.h) {
                    const rot = ((comp.rotation || 0) % 360 + 360) % 360;
                    const cursor = (rot === 90 || rot === 270) ? 'nesw-resize' : 'nwse-resize';
                    return { type: 'resize', component: comp, cursor };
                }
            }
        }

        if (sim.selectedWires.size === 1) {
            const wire = Array.from(sim.selectedWires)[0];
            for (let i = 0; i < wire.points.length; i++) {
                if (Geometry.dist(pos, wire.points[i]) < 8 / sim.scale) {
                    return { type: 'handle', wire: wire, index: i, cursor: 'move' };
                }
            }
        }

        for (let i = sim.components.length - 1; i >= 0; i--) {
            const c = sim.components[i];
            for (let j = 0; j < c.outputs.length; j++) {
                if (Geometry.dist(pos, c.getOutputPos(j)) < 15 / sim.scale) {
                    return { type: 'output', component: c, index: j, cursor: 'crosshair' };
                }
            }
            for (let j = 0; j < c.inputs.length; j++) {
                if (Geometry.dist(pos, c.getInputPos(j)) < 15 / sim.scale) {
                    return { type: 'input', component: c, index: j, cursor: 'crosshair' };
                }
            }
            if (c.isPointInside(pos)) {
                return { type: 'component', component: c, cursor: 'move' };
            }
        }

        for (const w of sim.wires) {
            const hit = this.getWireSegmentHit(pos, w);
            if (hit) {
                let cursor = 'pointer';
                let isMovable = false;
                if (hit.segType === 'H') {
                    if (hit.index > 0) { cursor = 'ns-resize'; isMovable = true; }
                } else if (hit.index < w.points.length) {
                    cursor = 'ew-resize';
                    isMovable = true;
                }
                return {
                    type: 'wire_segment',
                    wire: w,
                    segType: hit.segType,
                    index: hit.index,
                    isMovable: isMovable,
                    cursor: isMovable ? cursor : 'pointer'
                };
            }
        }
        return null;
    }

    getWireSegmentHit(p, w) {
        const start = w.startComp.getOutputPos(w.startIndex);
        const end = w.endComp.getInputPos(w.endIndex);
        const points = w.points || [];
        let current = start;
        const allPoints = [...points, end];
        const hitThresh = 6 / this.sim.scale;
        for (let i = 0; i < allPoints.length; i++) {
            const next = allPoints[i];
            const corner = { x: next.x, y: current.y };
            if (Geometry.distToSegment(p, current, corner) < hitThresh) return { segType: 'H', index: i };
            if (Geometry.distToSegment(p, corner, next) < hitThresh) return { segType: 'V', index: i };
            current = next;
        }
        return null;
    }

    handleDblClick(e) {
        const sim = this.sim;
        const pos = this.getMousePos(e);
        const hover = this.getHoverInfo(pos);
        if (!hover) return;

        if (hover.type === 'component') {
            const comp = hover.component;
            const bounds = comp.getBounds();
            const isTextComp = comp.type === 'TEXT';
            const screenX = isTextComp
                ? (bounds.x * sim.scale) + sim.offset.x
                : ((bounds.x + bounds.w / 2 - 40) * sim.scale) + sim.offset.x;
            const screenY = isTextComp
                ? (bounds.y * sim.scale) + sim.offset.y
                : ((bounds.y - 20) * sim.scale) + sim.offset.y;

            sim.textInput.style.display = 'block';
            sim.textInput.style.left = screenX + 'px';
            sim.textInput.style.top = screenY + 'px';
            if (isTextComp) {
                sim.textInput.style.width = Math.max(50, comp.w * sim.scale) + 'px';
                sim.textInput.style.fontSize = (comp.fontSize * sim.scale) + 'px';
                sim.textInput.style.color = comp.color;
                sim.textInput.style.textAlign = 'left';
                sim.textInput.value = comp.text;
            } else {
                sim.textInput.style.width = '80px';
                sim.textInput.style.fontSize = (12 * sim.scale) + 'px';
                sim.textInput.style.color = '#ffffff';
                sim.textInput.style.textAlign = 'center';
                sim.textInput.value = comp.name;
            }
            sim.textInput.dataset.compId = comp.id;
            sim.textInput.focus();
            sim.textInput.select();
        } else if (hover.type === 'handle') {
            sim.saveState();
            hover.wire.points.splice(hover.index, 1);
        } else if (hover.type === 'wire_segment') {
            sim.saveState();
            hover.wire.points.splice(hover.index, 0, { x: pos.x, y: pos.y });
            sim.selectedWires.clear();
            sim.selectedWires.add(hover.wire);
        }
        sim.updateUI();
    }

    handleMouseDown(e) {
        const sim = this.sim;
        if (e.button === 1) {
            sim.isPanning = true;
            sim.panStart = { x: e.clientX, y: e.clientY };
            sim.canvas.style.cursor = 'grabbing';
            return;
        }
        if (e.button !== 0) return;

        const pos = this.getMousePos(e);
        sim.lastMousePos = pos;

        if (sim.activeWire) {
            const hover = this.getHoverInfo(pos);
            if (hover && hover.type === 'input') {
                const isDuplicate = sim.wires.some((w) =>
                    w.startComp === sim.activeWire.startNode.component &&
                    w.startIndex === sim.activeWire.startNode.index &&
                    w.endComp === hover.component &&
                    w.endIndex === hover.index
                );
                if (!isDuplicate) {
                    sim.saveState();
                    sim.wires.push({
                        startComp: sim.activeWire.startNode.component,
                        startIndex: sim.activeWire.startNode.index,
                        endComp: hover.component,
                        endIndex: hover.index,
                        points: [...sim.activeWire.points]
                    });
                }
                sim.activeWire = null;
            } else {
                const lastPt = sim.activeWire.points[sim.activeWire.points.length - 1];
                if (!lastPt || Geometry.dist(pos, lastPt) > 5 / sim.scale) {
                    sim.activeWire.points.push({ x: pos.x, y: pos.y });
                }
            }
            return;
        }

        const hover = this.getHoverInfo(pos);
        if (hover) {
            if (hover.type === 'resize') {
                sim.saveState();
                sim.isResizing = true;
                sim.isDragging = true;
                sim.dragTarget = { type: 'resize', obj: hover.component };
                if (!sim.selectedComponents.has(hover.component)) {
                    sim.deselectAll();
                    sim.selectedComponents.add(hover.component);
                }
            } else if (hover.type === 'output') {
                sim.activeWire = { startNode: { component: hover.component, index: hover.index }, points: [] };
                sim.deselectAll();
            } else if (hover.type === 'component') {
                if (e.shiftKey || e.ctrlKey) {
                    if (sim.selectedComponents.has(hover.component)) sim.selectedComponents.delete(hover.component);
                    else sim.selectedComponents.add(hover.component);
                } else if (!sim.selectedComponents.has(hover.component)) {
                    sim.deselectAll();
                    sim.selectedComponents.add(hover.component);
                }
                sim.saveState();
                sim.dragTarget = { type: 'component', obj: hover.component };
                sim.isDragging = true;
                sim.dragOffset = { x: pos.x - hover.component.x, y: pos.y - hover.component.y };
                if (!e.shiftKey && !e.ctrlKey) {
                    if (['SWITCH', 'BUTTON', 'DIP_SWITCH'].includes(hover.component.type)) {
                        hover.component.toggle(pos);
                    }
                }
            } else if (hover.type === 'handle') {
                sim.saveState();
                sim.dragTarget = { type: 'handle', wire: hover.wire, index: hover.index };
                sim.isDragging = true;
            } else if (hover.type === 'wire_segment') {
                if (e.shiftKey || e.ctrlKey) {
                    if (sim.selectedWires.has(hover.wire)) sim.selectedWires.delete(hover.wire);
                    else sim.selectedWires.add(hover.wire);
                } else if (!sim.selectedWires.has(hover.wire)) {
                    sim.deselectAll();
                    sim.selectedWires.add(hover.wire);
                }
                if (hover.isMovable && sim.selectedWires.has(hover.wire)) {
                    sim.saveState();
                    sim.dragTarget = { type: 'segment', wire: hover.wire, segType: hover.segType, index: hover.index };
                    sim.isDragging = true;
                }
            }
        } else {
            if (!e.shiftKey && !e.ctrlKey) sim.deselectAll();
            sim.selectionBox = { start: { x: pos.x, y: pos.y }, current: { x: pos.x, y: pos.y } };
        }
        sim.updateUI();
    }

    handleMouseMove(e) {
        const sim = this.sim;
        if (sim.isPanning) {
            sim.offset.x += e.clientX - sim.panStart.x;
            sim.offset.y += e.clientY - sim.panStart.y;
            sim.panStart = { x: e.clientX, y: e.clientY };
            return;
        }

        const pos = this.getMousePos(e);
        sim.mousePos = pos;

        if (sim.selectionBox) {
            sim.selectionBox.current = pos;
            return;
        }

        if (!sim.isDragging && !sim.activeWire) {
            const hover = this.getHoverInfo(pos);
            sim.canvas.style.cursor = hover ? hover.cursor : 'default';
        } else if (sim.activeWire) {
            sim.canvas.style.cursor = 'crosshair';
        }

        if (sim.isDragging && sim.dragTarget) {
            const dx = pos.x - sim.lastMousePos.x;
            const dy = pos.y - sim.lastMousePos.y;
            if (sim.isResizing && sim.dragTarget.type === 'resize') {
                const comp = sim.dragTarget.obj;
                const oldTL = comp.localToWorld({ x: comp.x, y: comp.y });
                const lp = comp.worldToLocal(pos);
                if (comp.type === 'TEXT') {
                    const newH = Math.max(10, lp.y - comp.y);
                    comp.fontSize = newH;
                    comp.h = newH;
                } else {
                    comp.w = Math.max(comp.minW || 40, lp.x - comp.x);
                    comp.h = Math.max(comp.minH || 40, lp.y - comp.y);
                }
                const newTL = comp.localToWorld({ x: comp.x, y: comp.y });
                comp.x += oldTL.x - newTL.x;
                comp.y += oldTL.y - newTL.y;
            } else if (sim.dragTarget.type === 'component') {
                sim.selectedComponents.forEach((c) => {
                    c.x += dx;
                    c.y += dy;
                });
                const wiresToMove = new Set(sim.selectedWires);
                sim.wires.forEach((w) => {
                    if (sim.selectedComponents.has(w.startComp) && sim.selectedComponents.has(w.endComp)) {
                        wiresToMove.add(w);
                    }
                });
                wiresToMove.forEach((w) => {
                    w.points.forEach((p) => {
                        p.x += dx;
                        p.y += dy;
                    });
                });
            } else if (sim.dragTarget.type === 'handle') {
                sim.dragTarget.wire.points[sim.dragTarget.index] = { x: pos.x, y: pos.y };
            } else if (sim.dragTarget.type === 'segment') {
                const { wire, segType, index } = sim.dragTarget;
                if (segType === 'H' && index > 0) wire.points[index - 1].y = pos.y;
                else if (segType === 'V' && index < wire.points.length) wire.points[index].x = pos.x;
            }
        }

        sim.lastMousePos = pos;
    }

    handleMouseUp() {
        const sim = this.sim;
        if (sim.isPanning) {
            sim.isPanning = false;
            sim.canvas.style.cursor = 'default';
            return;
        }

        if (sim.selectionBox) {
            const x1 = Math.min(sim.selectionBox.start.x, sim.selectionBox.current.x);
            const y1 = Math.min(sim.selectionBox.start.y, sim.selectionBox.current.y);
            const x2 = Math.max(sim.selectionBox.start.x, sim.selectionBox.current.x);
            const y2 = Math.max(sim.selectionBox.start.y, sim.selectionBox.current.y);

            sim.components.forEach((c) => {
                const b = c.getBounds();
                if (b.x + b.w > x1 && b.x < x2 && b.y + b.h > y1 && b.y < y2) {
                    sim.selectedComponents.add(c);
                }
            });
            sim.wires.forEach((w) => {
                if (w.points.some((p) => p.x > x1 && p.x < x2 && p.y > y1 && p.y < y2)) {
                    sim.selectedWires.add(w);
                }
            });
            sim.selectionBox = null;
            sim.updateUI();
        }

        if (sim.dragTarget && sim.dragTarget.type === 'component' &&
            sim.dragTarget.obj && sim.dragTarget.obj.type === 'BUTTON') {
            sim.dragTarget.obj.state = false;
        }

        sim.isDragging = false;
        sim.isResizing = false;
        sim.dragTarget = null;
    }

    /**
     * Splits an existing wire at `pos` and starts branching a new wire from the same output source.
     * @param {object} targetWire
     * @param {{x: number, y: number}} pos
     */
    tapWire(targetWire, pos) {
        const sim = this.sim;
        sim.saveState();
        const hit = this.getWireSegmentHit(pos, targetWire);
        if (hit) {
            targetWire.points.splice(hit.index, 0, { x: pos.x, y: pos.y });
        } else {
            targetWire.points.push({ x: pos.x, y: pos.y });
        }
        sim.activeWire = {
            startNode: {
                component: targetWire.startComp,
                index: targetWire.startIndex
            },
            visualStart: { x: pos.x, y: pos.y },
            points: [{ x: pos.x, y: pos.y }]
        };
        sim.draw();
    }
}
