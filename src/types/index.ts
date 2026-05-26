export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'expired'
  | 'none';

export interface SessionImage {
  id: string;
  blob: Blob;
  timestamp: number;
}

export type CompareFrameRatio = '3:4' | '9:16' | '4:3';
export type CompareLayout = 'horizontal' | 'vertical';

export interface CompareImageState {
  id: string;
  src: string;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export interface CompareFrameSettings {
  ratio: CompareFrameRatio;
  layout: CompareLayout;
  borderEnabled: boolean;
  borderWidth: number;
  borderColor: string;
  dividerWidth: number;
  borderRadius: number;
}
