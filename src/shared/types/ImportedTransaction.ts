export type ImportedTransaction = {
  amount: number;
  merchant: string; // ruwe merchant uit CSV
  merchant_raw: string; // expliciet ruwe bron
  description: string;
  date: string;
  // eventueel meer velden afhankelijk van bank
};
