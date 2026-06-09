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
export type CapturePurpose = 'face' | 'skin' | 'eyes' | 'mouth' | 'body' | 'product' | 'video' | 'custom';
export type CaptureStyle = 'ghost' | 'compare';
export type CaptureMediaType = 'photo' | 'video';
export type CaptureOutputKind = 'side-by-side' | 'vertical' | 'overlay' | 'both';

export interface CapturePlan {
  purpose: CapturePurpose;
  style: CaptureStyle;
  mediaType: CaptureMediaType;
  outputKind: CaptureOutputKind;
  title: string;
  beforeLabel: string;
  afterLabel: string;
}

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
