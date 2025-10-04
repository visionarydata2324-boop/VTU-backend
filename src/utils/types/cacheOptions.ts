export interface CacheOptions {
  stdTTL?: number;
  checkperiod?: number;
  deleteOnExpire?: boolean;
  useClones?: boolean;
  saveInterval?: number;
  debug?: boolean;
  }

export interface VerificationData {
    email: string
    token: number
    expires: number
    ttl: 1742782230761
}