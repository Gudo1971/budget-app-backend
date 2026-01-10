export function receiptExtractionPrompt(ocrText: string) {
  return `
Je bent een AI die kassabonnen omzet naar gestructureerde JSON.

OCR tekst:
${ocrText}

Geef ALLEEN geldige JSON terug met:
- merchant
- date
- total
- subtotal
- tax
- currency
- items[] (name, quantity, price)
`;
}
