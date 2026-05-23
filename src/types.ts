export interface CleanerOptions {
  removeFigureNotes: boolean;
  strictNowrap: boolean;
}

export type ProcessingStatus = 'idle' | 'cleaning' | 'success' | 'error';

export interface CleanTextArgs {
  text: string;
  removeFigureNotes: boolean;
  strictNowrap: boolean;
}
