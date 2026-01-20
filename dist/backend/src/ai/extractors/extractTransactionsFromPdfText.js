"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTransactionsFromPdfText = extractTransactionsFromPdfText;
const engine_1 = require("../engine/engine");
const TransactionSchema_1 = require("../schemas/TransactionSchema");
const zod_1 = require("zod");
const TransactionsSchema = zod_1.z.array(TransactionSchema_1.TransactionSchema);
async function extractTransactionsFromPdfText(pdfText) {
    const prompt = `
Je bent een gespecialiseerd AI-model voor het extraheren van banktransacties uit PDF-tekst.

BELANGRIJK:
- Geef ALLEEN een geldige JSON-ARRAY terug.
- GEEN object.
- GEEN wrapper zoals {"transactions": [...] }.
- GEEN tekst buiten de JSON.
- GEEN uitleg.
- GEEN commentaar.
- De output MOET beginnen met '[' en eindigen met ']'.

Elke transactie in de array moet exact deze velden bevatten:
{
  "date": "dd-mm-jjjj",
  "description": "volledige omschrijving",
  "amount": -12.34,
  "currency": "EUR",
  "type": "income" | "expense",
  "confidence": number
}

Regels:
- Combineer multi-line omschrijvingen tot één transactie.
- Negeer tekst die geen transactie is.
- Als de tekst geen transacties bevat, geef een lege array terug: [].

Tekst:
${pdfText}
`;
    const result = await (0, engine_1.runExtraction)(prompt, TransactionsSchema);
    return result.filter((tx) => tx.date && tx.amount);
}
