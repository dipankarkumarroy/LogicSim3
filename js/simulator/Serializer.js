/**
 * Handles circuit JSON serialization, file export/import, URL hash loading, and state restoration.
 */
const Serializer = {
    /**
     * Serializes the current simulator viewport, components, and wires to a plain object.
     * @param {LogicSimulator} sim
     * @returns {object}
     */
    serialize(sim) {
        return {
            scale: sim.scale,
            offset: { ...sim.offset },
            globalLabelsVisible: sim.globalLabelsVisible,
            components: sim.components.map((c) => ({
                type: c.type,
                x: c.x, y: c.y, id: c.id, w: c.w, h: c.h,
                rotation: c.rotation || 0,
                name: c.name, frequency: c.frequency,
                text: c.text, fontSize: c.fontSize, color: c.color,
                showLabel: c.showLabel, bits: c.bits
            })),
            wires: sim.wires.map((w) => ({
                startCompId: w.startComp.id, startIndex: w.startIndex,
                endCompId: w.endComp.id, endIndex: w.endIndex,
                points: w.points.map((p) => ({ ...p }))
            }))
        };
    },

    /**
     * Prompts for a filename and downloads the serialized circuit as JSON.
     * @param {LogicSimulator} sim
     */
    saveCircuit(sim) {
        const name = prompt('Enter file name:', 'circuit');
        if (!name) return;
        const data = this.serialize(sim);
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name.endsWith('.json') ? name : name + '.json';
        a.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Imports one or more JSON circuit files from a file input element.
     * @param {LogicSimulator} sim
     * @param {HTMLInputElement} input
     */
    importCircuit(sim, input) {
        const files = Array.from(input.files);
        if (files.length === 0) return;

        const readFile = (file) => new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try { resolve(JSON.parse(e.target.result)); }
                catch (err) { console.error(err); resolve(null); }
            };
            reader.readAsText(file);
        });

        Promise.all(files.map(readFile)).then((datasets) => {
            datasets.forEach((data, index) => {
                if (!data) return;
                let isAppend = true;
                if (index === 0) {
                    if (sim.components.length === 0 || confirm('Replace current circuit with this file? (Cancel to Append)')) {
                        isAppend = false;
                    }
                }
                this.loadData(sim, data, isAppend);
            });
            input.value = '';
        });
    },

    /**
     * Loads a circuit data object into the simulator.
     * @param {LogicSimulator} sim
     * @param {object} data
     * @param {boolean} [append=false]
     * @param {boolean} [preserveHistory=false]
     */
    loadData(sim, data, append = false, preserveHistory = false) {
        if (!append) {
            if (!preserveHistory) {
                sim.historyManager.clear();
            }
            sim.reset(preserveHistory);
            if (data.scale !== undefined) sim.scale = data.scale;
            if (data.offset) sim.offset = { ...data.offset };
        }

        if (data.globalLabelsVisible !== undefined) {
            sim.globalLabelsVisible = data.globalLabelsVisible;
        }

        const compMap = {};
        if (data.components) {
            data.components.forEach((cData) => {
                const newId = sim.generateId();
                const c = new Component(cData.type, cData.x, cData.y, newId);
                c.w = cData.w;
                c.h = cData.h;
                c.rotation = ((cData.rotation || 0) % 360 + 360) % 360;
                if (cData.name) c.name = cData.name;
                if (cData.frequency) {
                    c.frequency = cData.frequency;
                    c.interval = 1000 / (2 * c.frequency);
                }
                if (c.type === 'CLOCK') {
                    c.lastToggle = sim.simTime;
                }
                if (cData.text) c.text = cData.text;
                if (cData.fontSize) c.fontSize = cData.fontSize;
                if (cData.color) c.color = cData.color;
                if (cData.showLabel !== undefined) c.showLabel = cData.showLabel;
                if (cData.bits) c.updateBits(cData.bits);
                sim.components.push(c);
                compMap[cData.id] = c;
            });
        }

        if (data.wires) {
            data.wires.forEach((wData) => {
                const startC = compMap[wData.startCompId];
                const endC = compMap[wData.endCompId];
                if (startC && endC) {
                    sim.wires.push({
                        startComp: startC, startIndex: wData.startIndex,
                        endComp: endC, endIndex: wData.endIndex,
                        points: wData.points ? wData.points.map((p) => ({ ...p })) : []
                    });
                }
            });
        }

        sim.updateUI();
        sim.draw();
    },

    /**
     * Fetches and loads a circuit file specified in `window.location.hash`.
     * @param {LogicSimulator} sim
     */
    async checkHashAndLoad(sim) {
        const hash = window.location.hash.substring(1);
        if (!hash) return;
        let url = decodeURIComponent(hash);
        if (!url.toLowerCase().endsWith('.json')) {
            url += '.json';
        }
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to load ${url}: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            this.loadData(sim, data, false);
            console.log('Circuit loaded from URL:', url);
        } catch (e) {
            console.error('URL Import Error:', e);
            const title = document.getElementById('alertTitle');
            const msg = document.getElementById('alertMsg');
            if (title) title.textContent = 'Import Failed';
            if (msg) msg.textContent = `Could not load "${url}"`;
            sim.alertBanner.style.display = 'flex';
            setTimeout(() => sim.clearAlert(), 5000);
        }
    }
};
