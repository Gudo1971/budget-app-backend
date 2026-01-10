export function receiptExtractionPrompt(ocrText: string) {
  return `
Je bent een AI die kassabonnen omzet naar gestructureerde JSON.
Gebruik de OCR-tekst hieronder als bron, maar verbeter inconsistenties waar nodig.

OCR tekst:
${ocrText}

Regels:
- Geef ALLEEN geldige JSON terug, zonder uitleg of tekst erbuiten.
- Negeer alle marketingtekst, QR-code teksten, slogans, reclame en overige irrelevante tekst.
- Als een waarde ontbreekt, vul null in.
- Prijzen moeten numbers zijn (geen €-teken).
- Quantity moet altijd een number zijn (default = 1).
- Items moeten altijd een array zijn.
- Gebruik ISO datumformaat als mogelijk (YYYY-MM-DD), anders exact zoals op de bon.
- Herken multipliers zoals "2x", "x2", "2 st", "3x Espresso".
- Herken CO₂-waarden per item als ze bestaan (bijv. 711, 586, 379, 297).
- Koppel CO₂-waarden aan het juiste item op basis van volgorde of nabijheid.
- Als er geen CO₂-waarden op de bon staan, zet "co2_grams" op null.
- Categoriseer elk item in een logische uitgavencategorie.
- Bepaal ook een hogere-orde categorie voor de merchant (merchant_category).

Toegestane itemcategorieën:
"food", "drinks", "groceries", "snacks", "household", "pharmacy", "electronics", "services", "other"

Toegestane merchantcategorieën:
"restaurant", "cafe", "fastfood", "supermarket", "bakery", "bar", "clothing", "electronics", "pharmacy", "retail", "services", "other"

JSON structuur:

{
  "merchant": "",
  "merchant_category": "",
  "date": "",
  "total": null,
  "subtotal": null,
  "tax": null,
  "currency": "EUR",
  "items": [
    {
      "name": "",
      "quantity": 1,
      "price": null,
      "co2_grams": null,
      "category": "other"
    }
  ]
}
`;
}
