/**
 * Analyzes connected subcircuits and generates interactive truth tables with circuit thumbnails.
 */
const TruthTableGenerator = {
    open() {
        document.getElementById('ttModal').style.display = 'flex';
    },

    close() {
        document.getElementById('ttModal').style.display = 'none';
    },

    /**
     * Finds connected component subgraphs via BFS over wires.
     * @param {LogicSimulator} sim
     * @returns {BaseComponent[][]}
     */
    findConnectedGroups(sim) {
        const visited = new Set();
        const groups = [];
        const getNeighbors = (comp) => {
            const neighbors = new Set();
            sim.wires.forEach((w) => {
                if (w.startComp === comp) neighbors.add(w.endComp);
                if (w.endComp === comp) neighbors.add(w.startComp);
            });
            return Array.from(neighbors);
        };

        sim.components.forEach((c) => {
            if (visited.has(c)) return;
            const group = [c];
            const queue = [c];
            visited.add(c);
            while (queue.length > 0) {
                const current = queue.shift();
                getNeighbors(current).forEach((n) => {
                    if (!visited.has(n)) {
                        visited.add(n);
                        queue.push(n);
                        group.push(n);
                    }
                });
            }
            groups.push(group);
        });
        return groups;
    },

    /**
     * Propagates signals across all components for settling combinational paths.
     * @param {LogicSimulator} sim
     * @param {number} [iterations=25]
     */
    settleCircuit(sim, iterations = 25) {
        for (let k = 0; k < iterations; k++) {
            sim.components.forEach((c) => c.resetInputs());
            sim.wires.forEach((w) => {
                w.endComp.setInput(w.endIndex, w.startComp.getOutput(w.startIndex));
            });
            sim.components.forEach((c) => c.calculate());
        }
    },

    /**
     * Generates truth table HTML and circuit group thumbnails into #ttContent.
     * @param {LogicSimulator} sim
     */
    generate(sim) {
        const contentDiv = document.getElementById('ttContent');
        contentDiv.innerHTML = '';
        const groups = this.findConnectedGroups(sim);
        let validGroupsFound = 0;

        const allSwitches = sim.components.filter((c) => c.type === 'SWITCH' || c.type === 'BUTTON');
        const allDips = sim.components.filter((c) => c.type === 'DIP_SWITCH');
        const initialSwitchStates = new Map(allSwitches.map((c) => [c, c.state]));
        const initialDipStates = new Map(allDips.map((c) => [c, [...c.switchState]]));

        const wasRunning = sim.isRunning;
        sim.isRunning = false;

        if (groups.length === 0) {
            contentDiv.innerHTML = '<div class="text-center text-gray-500 p-4">Canvas is empty.</div>';
            sim.isRunning = wasRunning;
            return;
        }

        groups.forEach((group, groupIndex) => {
            const inputComps = group
                .filter((c) => ['SWITCH', 'BUTTON', 'DIP_SWITCH'].includes(c.type))
                .sort((a, b) => (a.y - b.y) || (a.x - b.x));

            const outputComps = group
                .filter((c) => ['LIGHT', 'LED', 'BAR_GRAPH', 'BITS_OUT', 'LED_MATRIX'].includes(c.type))
                .sort((a, b) => (a.y - b.y) || (a.x - b.x));

            if (inputComps.length === 0 || outputComps.length === 0) return;

            const flatInputs = [];
            inputComps.forEach((c) => {
                if (c.type === 'SWITCH' || c.type === 'BUTTON') {
                    flatInputs.push({ comp: c, type: 'single', name: c.name });
                } else {
                    for (let i = c.bits - 1; i >= 0; i--) {
                        flatInputs.push({ comp: c, type: 'multi', index: i, name: `${c.name}.${i}` });
                    }
                }
            });

            const flatOutputs = [];
            outputComps.forEach((c) => {
                if (c.type === 'BAR_GRAPH' || c.type === 'BITS_OUT') {
                    for (let i = c.bits - 1; i >= 0; i--) {
                        flatOutputs.push({ comp: c, type: 'multi', index: i, name: `${c.name}.${i}` });
                    }
                } else if (c.type === 'LED_MATRIX') {
                    for (let i = 0; i < c.n; i++) {
                        flatOutputs.push({ comp: c, type: 'multi', index: i, name: `${c.name}.A${i}` });
                    }
                    for (let i = 0; i < c.n; i++) {
                        flatOutputs.push({ comp: c, type: 'multi', index: c.n + i, name: `${c.name}.C${i}` });
                    }
                } else {
                    flatOutputs.push({ comp: c, type: 'single', name: c.name });
                }
            });

            validGroupsFound++;

            let html = `<div class="mb-8 border border-gray-700 rounded bg-gray-800/50 overflow-hidden">`;
            html += `<div class="bg-gray-800 p-3 border-b border-gray-700 flex justify-between items-center"><h3 class="font-bold text-white">Circuit Group ${groupIndex + 1}</h3><span class="text-xs text-gray-400 bg-gray-900 px-2 py-1 rounded">${flatInputs.length} Inputs / ${flatOutputs.length} Outputs</span></div>`;
            html += `<div class="p-4 bg-gray-900 flex justify-center border-b border-gray-700"><canvas id="tt-canvas-${groupIndex}" width="100" height="100" style="max-width: 100%; height: auto;"></canvas></div>`;

            if (flatInputs.length > 16) {
                html += `<div class="p-4 text-yellow-500 text-center">Too many input bits (${flatInputs.length}). Limit is 16.</div></div>`;
                contentDiv.innerHTML += html;
                return;
            }

            html += '<div class="overflow-x-auto"><table class="w-full text-left border-collapse text-sm text-center"><thead class="bg-gray-900 text-gray-300"><tr>';
            flatInputs.forEach((i) => {
                html += `<th class="p-2 border-b border-gray-700 font-mono text-xs text-green-400 whitespace-nowrap">${i.name}</th>`;
            });
            html += '<th class="p-2 border-b border-gray-700 border-l border-gray-800 w-2 bg-gray-900"></th>';
            flatOutputs.forEach((o) => {
                html += `<th class="p-2 border-b border-gray-700 font-mono text-xs text-blue-400 whitespace-nowrap">${o.name}</th>`;
            });
            html += '</tr></thead><tbody>';

            const combinations = Math.pow(2, flatInputs.length);
            for (let i = 0; i < combinations; i++) {
                for (let j = 0; j < flatInputs.length; j++) {
                    const val = ((i >> (flatInputs.length - 1 - j)) & 1) === 1;
                    const inp = flatInputs[j];
                    if (inp.type === 'single') inp.comp.state = val;
                    else inp.comp.switchState[inp.index] = val;
                }
                this.settleCircuit(sim, 25);

                html += '<tr class="hover:bg-gray-700/50 transition-colors border-b border-gray-800">';
                for (let j = 0; j < flatInputs.length; j++) {
                    const val = (i >> (flatInputs.length - 1 - j)) & 1;
                    html += `<td class="p-2 ${val ? 'text-green-400 font-bold' : 'text-gray-600'}">${val}</td>`;
                }
                html += '<td class="border-l border-gray-800 bg-gray-900/30"></td>';
                flatOutputs.forEach((out) => {
                    const val = out.type === 'single' ? out.comp.state : out.comp.inputState[out.index];
                    html += `<td class="p-2 ${val ? 'text-blue-400 font-bold' : 'text-gray-600'}">${val ? 1 : 0}</td>`;
                });
                html += '</tr>';
            }
            html += '</tbody></table></div></div>';
            contentDiv.innerHTML += html;
        });

        if (validGroupsFound === 0) {
            contentDiv.innerHTML = `<div class="text-center p-8 text-gray-500">No valid circuits found (Need Inputs & Outputs).</div>`;
        }

        this.renderThumbnails(sim, groups);

        // Restore original input states and re-evaluate
        allSwitches.forEach((c) => { c.state = initialSwitchStates.get(c); });
        allDips.forEach((c) => { c.switchState = initialDipStates.get(c); });
        sim.isRunning = wasRunning;
        this.settleCircuit(sim, 1);
        sim.draw();
    },

    /**
     * Renders scaled preview thumbnails for each circuit group.
     * @param {LogicSimulator} sim
     * @param {BaseComponent[][]} groups
     */
    renderThumbnails(sim, groups) {
        groups.forEach((group, groupIndex) => {
            const relevantComps = group.filter((c) =>
                ['SWITCH', 'BUTTON', 'DIP_SWITCH', 'LIGHT', 'LED', 'BAR_GRAPH', 'BITS_OUT', 'LED_MATRIX'].includes(c.type)
            );
            if (relevantComps.length === 0) return;

            const canvas = document.getElementById(`tt-canvas-${groupIndex}`);
            if (!canvas) return;
            const ctx = canvas.getContext('2d');

            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            group.forEach((c) => {
                minX = Math.min(minX, c.x);
                minY = Math.min(minY, c.y);
                maxX = Math.max(maxX, c.x + c.w);
                maxY = Math.max(maxY, c.y + c.h);
            });

            const groupWires = sim.wires.filter((w) => group.includes(w.startComp) && group.includes(w.endComp));
            groupWires.forEach((w) => {
                w.points.forEach((p) => {
                    minX = Math.min(minX, p.x);
                    minY = Math.min(minY, p.y);
                    maxX = Math.max(maxX, p.x);
                    maxY = Math.max(maxY, p.y);
                });
                const s = w.startComp.getOutputPos(w.startIndex);
                const e = w.endComp.getInputPos(w.endIndex);
                minX = Math.min(minX, s.x, e.x);
                maxX = Math.max(maxX, s.x, e.x);
                minY = Math.min(minY, s.y, e.y);
                maxY = Math.max(maxY, s.y, e.y);
            });

            const pad = 20;
            const width = maxX - minX + pad * 2;
            const height = maxY - minY + pad * 2;
            const dispWidth = 400;
            canvas.width = dispWidth;
            canvas.height = height * (dispWidth / width);

            const scale = dispWidth / width;
            ctx.scale(scale, scale);
            ctx.translate(-minX + pad, -minY + pad);

            ctx.lineWidth = 2;
            ctx.strokeStyle = '#555';
            groupWires.forEach((w) => {
                const start = w.startComp.getOutputPos(w.startIndex);
                const end = w.endComp.getInputPos(w.endIndex);
                CanvasRenderer.drawOrthogonalWire(ctx, start, end, w.points);
                ctx.stroke();
            });

            group.forEach((c) => {
                c.draw(ctx, false);
                ctx.fillStyle = '#fff';
                ctx.font = '10px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(c.name, c.x + c.w / 2, c.y - 5);
            });
        });
    }
};
