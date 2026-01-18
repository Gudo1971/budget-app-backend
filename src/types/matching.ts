export type MatchInput = {
  receiptId: number;
  amount: number;
  date: string; // ISO string
  merchant: string;
};

export type MatchCandidate = {
  id: number;
  amount: number;
  date: string;
  merchant: string;
  score: number;
};

export type MatchDuplicate = {
  id: number;
  amount: number;
  date: string;
  merchant: string;
};

export type MatchAiResult = {
  id: number;
  amount: number;
  date: string;
  merchant: string;
};

export type MatchAction = "duplicate" | "aiMatch" | "candidates" | "no-match";

export type MatchResult = {
  action: MatchAction;
  duplicate: MatchDuplicate | null;
  aiMatch: MatchAiResult | null;
  candidates: MatchCandidate[];
  summary: string;
};
