"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.amountCloseEnough = amountCloseEnough;
function amountCloseEnough(a, b, tolerance = 0.05) {
    return Math.abs(a - b) <= tolerance;
}
