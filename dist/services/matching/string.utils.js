"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.levenshtein = levenshtein;
exports.similarity = similarity;
function levenshtein(a, b) {
    if (a === b)
        return 0;
    if (!a.length)
        return b.length;
    if (!b.length)
        return a.length;
    const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) {
        matrix[0][j] = j;
    }
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, // delete
            matrix[i][j - 1] + 1, // insert
            matrix[i - 1][j - 1] + cost // substitute
            );
        }
    }
    return matrix[a.length][b.length];
}
function similarity(a, b) {
    const distance = levenshtein(a.toLowerCase(), b.toLowerCase());
    const maxLen = Math.max(a.length, b.length);
    return 1 - distance / maxLen; // 0–1
}
