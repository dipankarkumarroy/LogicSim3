/**
 * Undo/Redo snapshot history manager for the simulator.
 */
class HistoryManager {
    /**
     * @param {LogicSimulator} sim
     * @param {number} [maxHistory=50]
     */
    constructor(sim, maxHistory = 50) {
        this.sim = sim;
        this.history = [];
        this.redoStack = [];
        this.maxHistory = maxHistory;
    }

    /**
     * Clears both undo and redo stacks.
     */
    clear() {
        this.history = [];
        this.redoStack = [];
    }

    /**
     * Captures the current circuit state onto the undo stack and clears redo history.
     */
    saveState() {
        this.redoStack = [];
        const snapshot = Serializer.serialize(this.sim);
        this.history.push(JSON.stringify(snapshot));
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * Restores the previous snapshot from the undo stack.
     */
    undo() {
        if (this.history.length === 0) return;
        const currentSnapshot = Serializer.serialize(this.sim);
        this.redoStack.push(JSON.stringify(currentSnapshot));

        const previousStateJSON = this.history.pop();
        Serializer.loadData(this.sim, JSON.parse(previousStateJSON), false, true);
    }

    /**
     * Restores the next snapshot from the redo stack.
     */
    redo() {
        if (this.redoStack.length === 0) return;
        const currentSnapshot = Serializer.serialize(this.sim);
        this.history.push(JSON.stringify(currentSnapshot));

        const nextStateJSON = this.redoStack.pop();
        Serializer.loadData(this.sim, JSON.parse(nextStateJSON), false, true);
    }
}
