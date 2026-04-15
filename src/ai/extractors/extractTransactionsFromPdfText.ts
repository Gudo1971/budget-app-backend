import { runExtraction } from "../engine/engine";
import { TransactionSchema } from "../schemas/TransactionSchema";
import { z } from "zod";

const TransactionsSchema = z.array(TransactionSchema);

export async function extractTransactionsFromPdfText(pdfText: string) {
  // ⭐ Detecteer GKB-document
  const isGkbPdf =
    pdfText.includes("BBR:") ||
    pdfText.toLowerCase().includes("reserveringnr") ||
    pdfText.toLowerCase().includes("vrij opneembaar") ||
    pdfText.toLowerCase().includes("leefgeld") ||
    pdfText.toLowerCase().includes("2-wekengeld") ||
    pdfText.toLowerCase().includes("gkb");

  const gkbRules = `
REGELS VOOR GKB-PDF’s:
- Positieve bedragen zijn NIET automatisch inkomsten.
- Veel GKB-transacties zijn interne potjesboekingen (reserveringen).
- Potjesboekingen zijn ALTIJD "expense", ook als het bedrag positief is.
- Herken potjesboekingen aan woorden zoals:
  "BBR:", "reserveringnr", "saldo reservering", "vrij opneembaar",
  "2-wekengeld", "leefgeld", "restant", "reservering", "GKB".

REGELS VOOR ECHTE INKOMSTEN:
- Alleen markeren als "income" als de omschrijving wijst op echte inkomsten:
  "weekgeld", "leefgeld", "bijstand", "uitkering", "loon", 
  "huurtoeslag", "zorgtoeslag", "toeslag", "inkomen".

REGELS VOOR BEDRAGEN:
- Gebruik het bedrag zoals het in de PDF staat.
- Het teken van het bedrag bepaalt NIET het type.
- Het type wordt bepaald door de omschrijving.
`;

  const prompt = `
Je bent een gespecialiseerd AI-model voor het extraheren van banktransacties uit PDF-tekst.

BELANGRIJK:
- Geef ALLEEN een geldige JSON-ARRAY terug.
- GEEN object, GEEN wrapper, GEEN tekst buiten JSON.

Elke transactie moet deze velden bevatten:
{
  "date": "dd-mm-jjjj",
  "description": "volledige omschrijving",
  "amount": -12.34,
  "currency": "EUR",
  "type": "income" | "expense",
  "confidence": number
}

${isGkbPdf ? gkbRules : ""}

Tekst:
${pdfText}
`;

  const result = await runExtraction(prompt, TransactionsSchema);
  return result.filter((tx) => tx.date && tx.amount);
}
