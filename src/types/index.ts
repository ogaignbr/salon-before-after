export type ShootingPart = 'face' | 'body';

export interface Session {
  id?: number;
  customerName: string;
  part: ShootingPart;
  beforeImage: Blob;
  afterImage?: Blob;
  createdAt: Date;
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'expired'
  | 'none';
