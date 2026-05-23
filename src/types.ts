export type ModeType = 'pangu' | 'autocorrect' | 'none';

export interface CleanerOptions {
  removeFigureNotes: boolean;
  strictNowrap: boolean;
  useAIMode: boolean;
  round1Mode: ModeType;
  round2Mode: ModeType;
}

export type ProcessingStatus = 'idle' | 'cleaning' | 'ai-thinking' | 'success' | 'error';

export interface CleanTextArgs {
  text: string;
  removeFigureNotes: boolean;
  round1: ModeType;
  round2: ModeType;
  strictNowrap: boolean;
}

export interface AICleanTextArgs {
  originalText: string;
  basicProcessedText: string;
  removeFigureNotes: boolean;
}
