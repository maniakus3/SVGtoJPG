
export interface SVGFile {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
  size: number;
  status: 'pending' | 'converting' | 'completed' | 'error';
}

export enum ConversionStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
