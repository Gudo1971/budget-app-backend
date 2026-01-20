"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itemExtractionPrompt = itemExtractionPrompt;
function itemExtractionPrompt(ocrText) {
    return `
Je bent een AI die individuele bonregels omzet naar gestructureerde item-data.

OCR tekst:
${ocrText}

Zet ALLEEN de items om naar een JSON array:
[
  {
    "name": string,
    "quantity": number,
    "price": number,
    "total": number | null,
    "category": string | null
  }
]

Regels:
- Herken multipliers zoals "2x", "x2", "2 *", "2 st".
- Herken prijzen zoals "1.99", "€1,99", "1,99", "1.99 EUR".
- Herken line totals als ze bestaan.
- Laat items zonder prijs NIET weg; geef price = 0 als fallback.
- Bepaal een categorie per item (zoals groceries, drinks, household, snacks, pharmacy, electronics).
- Gebruik alleen categorieën die logisch zijn voor dagelijkse uitgaven.
- Geen tekst buiten de JSON array.
`;
}
