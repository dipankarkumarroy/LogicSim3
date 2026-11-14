/**
 * Core Logic Simulator orchestrator managing simulation state, component/wire lifecycle,
 * and delegating history, serialization, truth tables, input handling, and rendering to modules.
 */
class LogicSimulator {
    constructor() {
        this.canvas = document.getElementById('simCanvas');
        this.canvas.style.touchAction = 'none';
        this.ctx = this.canvas.getContext('2d');
        this.container = document.getElementById('canvas-container');
        this.contextMenu = document.getElementById('contextMenu');
        this.alertBanner = document.getElementById('alertBanner');
        this.colorPicker = document.getElementById('hiddenColorPicker');
        this.textInput = document.getElementById('onCanvasInput');

        this.components = [];
        this.wires = [];
        this.selectedComponents = new Set();
        this.selectedWires = new Set();
        this.selectionBox = null;
        this.clipboard = null;

        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.isPanning = false;
        this.panStart = { x: 0, y: 0 };

        this.isDragging = false;
        this.isResizing = false;
        this.dragTarget = null;
        this.dragOffset = { x: 0, y: 0 };
        this.lastMousePos = { x: 0, y: 0 };

        this.activeWire = null;
        this.mousePos = { x: 0, y: 0 };

        this.isRunning = false;
        this.lastTime = 0;
        this.simTime = 0;
        this.shortCircuitPos = null;
        this.globalLabelsVisible = true;

        this.historyManager = new HistoryManager(this, 50);
        this.contextMenuManager = new ContextMenuManager(this);
        this.inputHandler = new InputHandler(this);

        this.resize();
        this.inputHandler.setupEvents();

        this.setSimulationState(true);
        requestAnimationFrame((t) => this.loop(t));

        Serializer.checkHashAndLoad(this);
        window.addEventListener('hashchange', () => Serializer.checkHashAndLoad(this));
    }

    // --- History Delegation ---
    saveState() { this.historyManager.saveState(); }
    undo() { this.historyManager.undo(); }
    redo() { this.historyManager.redo(); }

    // --- Truth Table Delegation ---
    openTruthTable() { TruthTableGenerator.open(); }
    closeTruthTable() { TruthTableGenerator.close(); }
    generateTruthTable() { TruthTableGenerator.generate(this); }

    // --- Serialization Delegation ---
    newCircuit() {
        if (confirm('Start a new circuit? Unsaved changes will be lost.')) {
            this.reset();
        }
    }
    saveCircuit() { Serializer.saveCircuit(this); }
    importCircuit(input) { Serializer.importCircuit(this, input); }
    loadData(data, append = false, preserveHistory = false) {
        Serializer.loadData(this, data, append, preserveHistory);
    }

    // --- Context Menu Delegation ---
    handleContextMenu(e) { this.contextMenuManager.handleContextMenu(e); }
    hideContextMenu() { this.contextMenuManager.hide(); }

    // --- Viewport & State ---
    resize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    reset(preserveHistory = false) {
        this.components = [];
        this.wires = [];
        this.activeWire = null;
        this.scale = 1;
        this.offset = { x: 0, y: 0 };
        this.simTime = 0;
        this.clearAlert();
        this.deselectAll();

        if (!preserveHistory) {
            this.historyManager.clear();
        }
        this.setSimulationState(true);
    }

    toggleGlobalLabels() {
        this.saveState();
        this.globalLabelsVisible = !this.globalLabelsVisible;
        this.draw();
    }

    setSimulationState(play) {
        this.isRunning = play;
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const status = document.getElementById('statusOverlay');
        if (play) {
            playBtn.classList.add('bg-gray-700');
            pauseBtn.classList.remove('bg-gray-700');
            status.classList.add('hidden');
            this.shortCircuitPos = null;
            this.clearAlert();
        } else {
            playBtn.classList.remove('bg-gray-700');
            pauseBtn.classList.add('bg-gray-700');
            status.classList.remove('hidden');
        }
    }

    triggerShortCircuit(component, inputIndex) {
        this.setSimulationState(false);
        this.shortCircuitPos = component.getInputPos(inputIndex);
        this.alertBanner.style.display = 'flex';
        this.draw();
    }

    clearAlert() {
        this.alertBanner.style.display = 'none';
        this.shortCircuitPos = null;
    }

    // --- Component & Selection Lifecycle ---
    addComponent(type) {
        this.saveState();
        const cx = (this.canvas.width / 2 - this.offset.x) / this.scale;
        const cy = (this.canvas.height / 2 - this.offset.y) / this.scale;
        const x = cx + (Math.random() * 40 - 20);
        const y = cy + (Math.random() * 40 - 20);
        const comp = new Component(type, x, y, this.generateId());
        if (comp.type === 'CLOCK') comp.lastToggle = this.simTime;
        this.components.push(comp);
        this.deselectAll();
        this.selectedComponents.add(comp);
        this.updateUI();
    }

    /**
     * Rotates all currently selected components by `delta` degrees (default 90 clockwise).
     * @param {number} [delta=90]
     */
    rotateSelection(delta = 90) {
        if (this.selectedComponents.size === 0) return;
        this.saveState();
        this.selectedComponents.forEach((c) => c.rotate(delta));
        this.draw();
    }

    deleteSelection() {
        if (this.selectedComponents.size === 0 && this.selectedWires.size === 0) return;
        this.saveState();
        this.selectedWires.forEach((w) => {
            const idx = this.wires.indexOf(w);
            if (idx > -1) this.wires.splice(idx, 1);
        });
        this.selectedComponents.forEach((c) => {
            this.wires = this.wires.filter((w) => w.startComp !== c && w.endComp !== c);
            const idx = this.components.indexOf(c);
            if (idx > -1) this.components.splice(idx, 1);
        });
        this.deselectAll();
        this.updateUI();
        if (this.shortCircuitPos) {
            this.shortCircuitPos = null;
            this.alertBanner.style.display = 'none';
        }
    }

    deselectAll() {
        this.selectedComponents.clear();
        this.selectedWires.clear();
        this.updateUI();
        this.textInput.style.display = 'none';
    }

    generateId() {
        return 'comp_' + Math.random().toString(36).substr(2, 9);
    }

    copySelection() {
        if (this.selectedComponents.size === 0) return;
        let minX = Infinity;
        let minY = Infinity;
        this.selectedComponents.forEach((c) => {
            if (c.x < minX) minX = c.x;
            if (c.y < minY) minY = c.y;
        });

        const componentsData = [];
        const compMap = new Map();
        let idx = 0;
        this.selectedComponents.forEach((c) => {
            compMap.set(c, idx++);
            componentsData.push({
                type: c.type,
                x: c.x - minX, y: c.y - minY, w: c.w, h: c.h,
                rotation: c.rotation || 0,
                name: c.name, frequency: c.frequency,
                text: c.text, fontSize: c.fontSize, color: c.color, bits: c.bits
            });
        });

        const wiresData = [];
        this.wires.forEach((w) => {
            if (this.selectedComponents.has(w.startComp) && this.selectedComponents.has(w.endComp)) {
                wiresData.push({
                    startIndex: compMap.get(w.startComp), startPinIdx: w.startIndex,
                    endIndex: compMap.get(w.endComp), endPinIdx: w.endIndex,
                    points: w.points.map((p) => ({ x: p.x - minX, y: p.y - minY }))
                });
            }
        });
        this.clipboard = { components: componentsData, wires: wiresData };
    }

    pasteSelection() {
        if (!this.clipboard) return;
        this.saveState();
        this.deselectAll();
        const baseX = this.mousePos.x;
        const baseY = this.mousePos.y;
        const newComponents = [];

        this.clipboard.components.forEach((data) => {
            const comp = new Component(data.type, baseX + data.x, baseY + data.y, this.generateId());
            comp.w = data.w;
            comp.h = data.h;
            comp.rotation = ((data.rotation || 0) % 360 + 360) % 360;
            comp.name = data.name;
            if (data.frequency) {
                comp.frequency = data.frequency;
                comp.interval = 1000 / (2 * comp.frequency);
            }
            if (comp.type === 'CLOCK') comp.lastToggle = this.simTime;
            if (data.type === 'TEXT') {
                comp.text = data.text;
                comp.fontSize = data.fontSize;
                comp.color = data.color;
            }
            if (data.bits) comp.updateBits(data.bits);
            this.components.push(comp);
            newComponents.push(comp);
            this.selectedComponents.add(comp);
        });

        this.clipboard.wires.forEach((data) => {
            const startComp = newComponents[data.startIndex];
            const endComp = newComponents[data.endIndex];
            if (startComp && endComp) {
                this.wires.push({
                    startComp: startComp, startIndex: data.startPinIdx,
                    endComp: endComp, endIndex: data.endPinIdx,
                    points: data.points.map((p) => ({ x: baseX + p.x, y: baseY + p.y }))
                });
            }
        });
        this.updateUI();
    }

    updateUI() {
        const delBtn = document.getElementById('deleteBtn');
        const hasSelection = this.selectedComponents.size > 0 || this.selectedWires.size > 0;
        delBtn.disabled = !hasSelection;
        if (hasSelection) {
            delBtn.classList.remove('text-gray-400');
            delBtn.classList.add('text-red-400');
        } else {
            delBtn.classList.add('text-gray-400');
            delBtn.classList.remove('text-red-400');
        }

        const rotateBtn = document.getElementById('rotateBtn');
        if (rotateBtn) {
            const hasCompSelection = this.selectedComponents.size > 0;
            rotateBtn.disabled = !hasCompSelection;
            rotateBtn.classList.toggle('text-gray-400', !hasCompSelection);
            rotateBtn.classList.toggle('text-blue-400', hasCompSelection);
        }
    }

    // --- Simulation Loop & Rendering ---
    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        const rawDt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        const dt = Math.min(Math.max(rawDt, 0), 50);
        if (this.isRunning) {
            this.stepSimulation(dt);
        }
        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }

    /**
     * Advances simulation across elapsed frame time `dt` using event-driven clock sub-stepping
     * so frequencies above 30 Hz execute accurately without aliasing.
     * @param {number} dt
     */
    stepSimulation(dt) {
        if (!this.isRunning) return;
        const clocks = this.components.filter((c) => c.type === 'CLOCK' && c.interval > 0);
        let currentTime = this.simTime;
        const targetTime = currentTime + dt;

        for (const c of clocks) {
            if (currentTime - c.lastToggle > c.interval * 2) {
                c.lastToggle = currentTime;
            }
        }

        const MAX_STEPS_PER_FRAME = 2500;
        const MAX_WALL_MS = 8;
        const startWall = performance.now();
        let steps = 0;
        let hitBudget = false;

        while (clocks.length > 0) {
            let minNext = Infinity;
            for (const c of clocks) {
                const next = c.lastToggle + c.interval;
                if (next < minNext) minNext = next;
            }
            if (minNext > targetTime) break;

            if (steps >= MAX_STEPS_PER_FRAME ||
                (steps > 0 && (steps & 31) === 0 && (performance.now() - startWall) >= MAX_WALL_MS)) {
                hitBudget = true;
                break;
            }

            currentTime = minNext;
            for (const c of clocks) {
                if (c.lastToggle + c.interval <= currentTime + 1e-9) {
                    c.state = !c.state;
                    c.lastToggle += c.interval;
                    c.outputState[0] = c.state;
                }
            }

            if (!this.settleStep(currentTime)) {
                this.simTime = currentTime;
                return;
            }
            steps++;
        }

        if (!hitBudget) {
            this.simTime = targetTime;
            const res = this.runPropagationPass();
            if (res.shorted) return;
            this.sampleInstruments(targetTime);
        } else {
            this.simTime = currentTime;
        }
    }

    /**
     * Runs one wire-transfer and component-calculation pass.
     * @returns {{shorted: boolean, changed: boolean}}
     */
    runPropagationPass() {
        this.components.forEach((c) => c.resetInputs());
        this.wires.forEach((w) => {
            const val = w.startComp.getOutput(w.startIndex);
            w.endComp.setInput(w.endIndex, val);
            w.state = val;
        });
        for (const c of this.components) {
            const conflictIndex = c.checkShorts();
            if (conflictIndex !== -1) {
                this.triggerShortCircuit(c, conflictIndex);
                return { shorted: true, changed: false };
            }
        }
        let changed = false;
        for (const c of this.components) {
            const outLen = c.outputState.length;
            const prevOut = outLen > 0 ? c.outputState.slice() : null;
            c.calculate();
            if (prevOut) {
                for (let i = 0; i < outLen; i++) {
                    if (prevOut[i] !== c.outputState[i]) {
                        changed = true;
                        break;
                    }
                }
            }
        }
        return { shorted: false, changed };
    }

    /**
     * Settles combinational and cascaded logic at timestamp `time`, then samples instruments.
     * @param {number} time
     * @returns {boolean} False if a short circuit halted simulation.
     */
    settleStep(time) {
        for (let pass = 0; pass < 16; pass++) {
            const res = this.runPropagationPass();
            if (res.shorted) return false;
            if (!res.changed) break;
        }
        this.sampleInstruments(time);
        return true;
    }

    sampleInstruments(time) {
        this.components.forEach((c) => {
            if (c.type === 'SCOPE') c.updateScope(time);
            if (c.type === 'ANALYZER') c.updateAnalyzer(time);
        });
    }

    simulate(time, force = false) {
        if (!this.isRunning && !force) return;
        this.components.forEach((c) => {
            if (c.type === 'CLOCK') c.updateClock(time);
        });
        this.settleStep(time);
    }

    draw() {
        CanvasRenderer.draw(this);
    }
}
