export interface RedisValue {
  value: any;
  expirationDate: number | false;
}

export interface RedisKeyOpts {
  /** Expiration interval (in seconds) */
  expiresAt?: number;
}

export function convertToJson(val: string): object | string {
  try {
    return JSON.parse(val);
  } catch (err) {
    return val;
  }
}

export function convertToString(val: any) {
  switch (typeof val) {
    case 'object':
      return JSON.stringify(val);
    case 'function':
      throw new Error('Cannot push functions into REDIS');
    default:
      return val;
  }
}
