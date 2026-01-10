export function transactionExtractionPrompt(text: string) {
  return `
Je bent een AI die losse transactie-tekst omzet naar gestructureerde JSON.

Tekst:
${text}

Geef ALLEEN geldige JSON terug met:
- merchant
- amount
- currency
- category
- date
- type (income/expense)
- confidence (0-1)
`;
}
