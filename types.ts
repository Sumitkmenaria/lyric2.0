
export enum View {
  INPUT = 'INPUT',
  PREVIEW = 'PREVIEW',
  TIMELINE_EDITOR = 'TIMELINE_EDITOR',
}

export type Lyric = {
  text: string;
  startTime: number;
};

export type AspectRatio = '16:9' | '9:16';

export type HindiFont = 'Mukta' | 'Tiro' | 'Baloo';

export type VisualizationStyle = 'classic' | 'vinyl' | 'waves' | 'big_text';

export interface AppState {
  view: View;
  audioFile: File | null;
  imageFile: File | null;
  audioUrl: string | null;
  audioDuration: number;
  imageUrl: string | null;
  rawLyrics: string;
  structuredLyrics: Lyric[];
  error: string | null;
  isLoading: boolean;
  isExporting: boolean;
  exportProgress: number;
  songName: string;
  creatorName: string;
  aspectRatio: AspectRatio;
  visualizationStyle: VisualizationStyle;
  imageColors: string[];
  hindiFont: HindiFont;
  loaderMessage?: string;
  wasTimingAutoGenerated: boolean;
}
