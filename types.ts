
export enum Role {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Message {
  role: Role;
  text: string;
  timestamp: number;
  imageData?: {
    data: string;
    mimeType: string;
  };
}

export interface SystemState {
  isInitialized: boolean;
  termuxInfo: string | null;
  architecture: 'aarch64' | 'other' | null;
  androidVersion: string | null;
  isRooted: boolean;
}

export interface ArtifactResponse {
  analysis: string;
  strategy: string;
  script: string;
  masterclass: string;
}
