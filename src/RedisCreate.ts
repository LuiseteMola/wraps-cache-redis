import * as Redis from 'ioredis';
import { logger } from 'wraps-cache';
import { RedisCacheConfiguration } from './interfaces';

export function showNoConfigWarn(config: RedisCacheConfiguration = {}) {
  logger.warn('No REDIS configured. Check environment variables');
  logger.warn('For Cluster: REDIS_CLUSTER = [{"host": "127.0.0.1", "port": 6381}].');
  logger.warn('For single node: REDIS_HOST=127.0.0.1 / REDIS_PORT=6381.');
  logger.warn('Current values:');
  logger.warn(`REDIS_CLUSTER: ${config.cluster || process.env.REDIS_CLUSTER}`);
  logger.warn(`REDIS_HOST: ${config.host || process.env.REDIS_HOST}`);
  logger.warn(`REDIS_PORT: ${config.port || process.env.REDIS_PORT}`);
  logger.warn(`REDIS_APP_KEY: ${config.appKey || process.env.REDIS_APP_KEY}`);
  return;
}

export function createSingle(config: RedisCacheConfiguration = {}): Redis.Redis {
  const host = config.host || process.env.REDIS_HOST;
  const port = config.port || process.env.REDIS_PORT;
  const appKey = config.appKey || process.env.REDIS_APP_KEY;
  logger.info('Configured REDIS in single-node environment');
  logger.info(`REDIS_HOST: ${host}`);
  logger.info(`REDIS_PORT: ${port}`);
  logger.info(`REDIS_APP_KEY: ${appKey}`);
  return new Redis({ host: host, port: Number(port) });
}

export function createCluster(config: Redis.NodeConfiguration[] = []): Redis.Redis {
  logger.info('Configured REDIS in Cluster environment');
  const clusterConfig: Redis.NodeConfiguration[] = config || JSON.parse(process.env.REDIS_CLUSTER);
  clusterConfig.map((node, idx) => {
    logger.info(`Node ${idx}: ${node.host} - ${node.port}`);
  });
  logger.info(`REDIS_APP_KEY: ${process.env.REDIS_APP_KEY}`);
  return new Redis.Cluster(clusterConfig);
}

export function redisCreate(config: RedisCacheConfiguration = {}) {
  if (config.cluster || process.env.REDIS_CLUSTER) return createCluster(config.cluster);
  else if (process.env.REDIS_HOST && process.env.REDIS_PORT) return createSingle(config);
  else return showNoConfigWarn();
}
