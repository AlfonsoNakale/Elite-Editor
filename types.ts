
export type Tone = 'Professional' | 'Formal' | 'Casual' | 'Assertive' | 'Friendly' | 'Diplomatic';

export interface PolishedResponse {
  polishedText: string;
  summaryOfChanges: string[];
}

export interface HistoryItem {
  id: string;
  original: string;
  polished: string;
  summary: string[];
  tone: Tone;
  timestamp: number;
}
