import { NodeConfiguration } from 'ioredis';

export interface RedisCacheConfiguration {
  host?: string;
  port?: number;
  appKey?: string;
  cluster?: NodeConfiguration[]; // Array<NodeConfiguration>;
}
