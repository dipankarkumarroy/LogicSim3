/**
 * 2D Euclidean distance and point-to-segment distance utilities.
 */
const Geometry = {
    /**
     * Computes Euclidean distance between two points.
     * @param {{x: number, y: number}} p1
     * @param {{x: number, y: number}} p2
     * @returns {number}
     */
    dist(p1, p2) {
        return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
    },

    /**
     * Computes shortest distance from point p to segment vw.
     * @param {{x: number, y: number}} p
     * @param {{x: number, y: number}} v
     * @param {{x: number, y: number}} w
     * @returns {number}
     */
    distToSegment(p, v, w) {
        const l2 = this.dist(v, w) ** 2;
        if (l2 === 0) return this.dist(p, v);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
        return this.dist(p, proj);
    }
};
