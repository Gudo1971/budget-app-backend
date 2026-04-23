export type PeriodType = "day" | "week" | "month" | "year" | "custom";

export interface PeriodSelection {
  type: PeriodType;
  year?: number;
  month?: number;
  week?: number;
  days?: string[]; // ISO dates
  from?: string; // ISO date
  to?: string; // ISO date
}

export interface RangeResult {
  from: string;
  to: string;
}

export interface WeekInfo {
  weekNumber: number;
  from: string;
  to: string;
}

export interface MonthInfo {
  month: number;
  label: string;
}

export interface FilterPanelItem {
  label: string;
  value: string | number;
}

export interface PeriodSelectorProps {
  onChange: (selection: PeriodSelection) => void;
}
