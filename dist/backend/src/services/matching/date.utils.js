"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dateRange = dateRange;
function dateRange(center, days) {
    const base = new Date(center);
    const dates = [];
    for (let offset = -days; offset <= days; offset++) {
        const d = new Date(base);
        d.setDate(base.getDate() + offset);
        dates.push(d.toISOString().slice(0, 10));
    }
    return dates;
}
