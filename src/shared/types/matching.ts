export type MatchInput = {
  receiptId: number;

  // Bedrag van de bon
  amount: number;

  // Bankdatum (fallback)
  date?: string;

  // Aankoopdatum (AI)
  transaction_date?: string;

  // Genormaliseerde merchant (AI)
  merchant?: string;

  // Ruwe merchant van AI (UI-naam)
  merchant_raw?: string;
};

export type MatchCandidate = {
  id: number;
  amount: number;
  date: string;
  merchant?: string;
  score: number;
};

export type MatchDuplicate = {
  id: number;
  amount: number;
  date: string;
  merchant?: string;
};

export type MatchAiResult = {
  id: number;
  amount: number;
  date: string;
  merchant?: string;
};

export type MatchAction = "duplicate" | "aiMatch" | "candidates" | "no-match";

export type MatchResult = {
  action: MatchAction;
  duplicate: MatchDuplicate | null;
  aiMatch: MatchAiResult | null;
  candidates: MatchCandidate[];
  summary: string;
};
