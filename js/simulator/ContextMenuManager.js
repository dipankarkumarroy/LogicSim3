const BIT_CONFIGURABLE_TYPES = [
    'DIP_SWITCH', 'BAR_GRAPH', 'BITS_OUT', 'LED_MATRIX',
    'MULTIPLEXER', 'DEMULTIPLEXER', 'DECODER'
];

/**
 * Manages the right-click / long-press context menu and inline on-canvas text/value input.
 */
class ContextMenuManager {
    /**
     * @param {LogicSimulator} sim
     */
    constructor(sim) {
        this.sim = sim;
        this.contextMenu = document.getElementById('contextMenu');
        this.setupCloseListeners();
    }

    setupCloseListeners() {
        const isInsideMenu = (e) => e.target.closest('#contextMenu') || e.target.closest('#hiddenColorPicker');

        document.addEventListener('click', (e) => {
            if (this.contextMenu.style.display === 'block' && !isInsideMenu(e)) {
                this.hide();
            }
        });

        document.addEventListener('touchstart', (e) => {
            if (this.contextMenu.style.display === 'block' && !isInsideMenu(e)) {
                if (e.cancelable) e.preventDefault();
                this.hide();
            }
        }, { passive: false });
    }

    hide() {
        this.contextMenu.style.display = 'none';
    }

    /**
     * Opens the context menu for the hovered component or wire.
     * @param {MouseEvent|object} e
     */
    handleContextMenu(e) {
        const clientX = e.clientX;
        const clientY = e.clientY;
        const pageX = e.pageX || e.clientX;
        const pageY = e.pageY || e.clientY;

        const pos = this.sim.inputHandler.getMousePos({ clientX, clientY });
        const hover = this.sim.inputHandler.getHoverInfo(pos);

        const items = {
            tapWire: document.getElementById('ctxTapWire'),
            rotate: document.getElementById('ctxRotate'),
            freq: document.getElementById('ctxFreq'),
            bits: document.getElementById('ctxBits'),
            rename: document.getElementById('ctxRename'),
            toggleLabel: document.getElementById('ctxToggleLabel'),
            editText: document.getElementById('ctxEditText'),
            textColor: document.getElementById('ctxTextColor')
        };

        Object.values(items).forEach((el) => { if (el) el.style.display = 'none'; });

        if (!hover || !['component', 'wire_segment', 'handle'].includes(hover.type)) {
            this.hide();
            return;
        }

        if (hover.type === 'component') {
            if (!this.sim.selectedComponents.has(hover.component)) {
                this.sim.deselectAll();
                this.sim.selectedComponents.add(hover.component);
            }
        } else if (!this.sim.selectedWires.has(hover.wire)) {
            this.sim.deselectAll();
            this.sim.selectedWires.add(hover.wire);
        }

        this.sim.updateUI();

        const x = Math.min(pageX, window.innerWidth - 150);
        const y = Math.min(pageY, window.innerHeight - 100);

        if (hover.type === 'wire_segment' || hover.type === 'handle') {
            items.tapWire.style.display = 'flex';
            items.tapWire.onclick = () => {
                this.sim.inputHandler.tapWire(hover.wire, pos);
                this.hide();
            };
        }

        if (this.sim.selectedComponents.size >= 1 && items.rotate) {
            items.rotate.style.display = 'flex';
            items.rotate.onclick = () => {
                this.sim.rotateSelection(90);
                this.hide();
            };
        }

        if (this.sim.selectedComponents.size === 1) {
            const comp = Array.from(this.sim.selectedComponents)[0];
            this.configureComponentOptions(comp, items, x, y);
        }

        this.contextMenu.style.display = 'block';
        this.contextMenu.style.left = x + 'px';
        this.contextMenu.style.top = y + 'px';
    }

    configureComponentOptions(comp, items, x, y) {
        if (comp.type === 'TEXT') {
            items.editText.style.display = 'flex';
            items.editText.onclick = () => {
                this.hide();
                this.showInput(x, y, comp.text, (newText) => {
                    this.sim.saveState();
                    comp.text = newText;
                    this.sim.draw();
                });
            };

            items.textColor.style.display = 'flex';
            items.textColor.onclick = () => {
                this.sim.colorPicker.click();
                this.hide();
            };
            return;
        }

        items.rename.style.display = 'flex';
        items.rename.onclick = () => {
            this.hide();
            this.showInput(x, y, comp.name, (newName) => {
                if (newName && newName.trim() !== '') {
                    this.sim.saveState();
                    comp.name = newName.trim();
                    this.sim.draw();
                }
            });
        };

        items.toggleLabel.style.display = 'flex';
        items.toggleLabel.onclick = () => {
            this.sim.saveState();
            comp.showLabel = !comp.showLabel;
            this.sim.draw();
            this.hide();
        };

        if (comp.type === 'CLOCK') {
            items.freq.style.display = 'flex';
            items.freq.onclick = () => {
                this.hide();
                this.showInput(x, y, comp.frequency || 1, (val) => {
                    const freq = this.parseFrequency(val);
                    if (freq && !isNaN(freq) && freq > 0) {
                        this.sim.saveState();
                        comp.frequency = freq;
                        comp.interval = 1000 / (2 * freq);
                        comp.lastToggle = this.sim.simTime;
                    }
                });
            };
        }

        if (BIT_CONFIGURABLE_TYPES.includes(comp.type)) {
            items.bits.style.display = 'flex';
            items.bits.onclick = () => {
                this.hide();
                this.showInput(x, y, comp.bits || 8, (val) => {
                    const n = parseInt(val, 10);
                    if (n && !isNaN(n) && n > 0 && n <= 32) {
                        this.sim.saveState();
                        comp.updateBits(n);
                        this.sim.draw();
                    }
                });
            };
        }
    }

    /**
     * Parses a frequency string with optional k/M and Hz suffixes (e.g. "100", "2.5k", "1MHz").
     * @param {string|number} raw
     * @returns {number}
     */
    parseFrequency(raw) {
        const str = String(raw).trim().toLowerCase().replace(/hz$/i, '').trim();
        const match = str.match(/^([0-9]*\.?[0-9]+)\s*([km]?)$/);
        if (!match) return NaN;
        let num = parseFloat(match[1]);
        if (match[2] === 'k') num *= 1000;
        else if (match[2] === 'm') num *= 1000000;
        return num;
    }

    /**
     * Displays the inline on-canvas input box at screen coordinates (x, y).
     * @param {number} x
     * @param {number} y
     * @param {string|number} initialValue
     * @param {(value: string) => void} callback
     */
    showInput(x, y, initialValue, callback) {
        const input = document.getElementById('onCanvasInput');
        input.style.display = 'block';
        input.style.left = x + 'px';
        input.style.top = y + 'px';
        input.value = initialValue;
        input.focus();
        input.select();

        const finish = () => {
            input.style.display = 'none';
            input.onkeydown = null;
            input.onblur = null;
        };

        input.onkeydown = (e) => {
            e.stopPropagation();
            if (e.key === 'Enter') {
                const val = input.value;
                finish();
                if (val !== null) callback(val);
            } else if (e.key === 'Escape') {
                finish();
            }
        };

        input.onblur = () => {
            const val = input.value;
            finish();
            if (val !== null) callback(val);
        };
    }
}
