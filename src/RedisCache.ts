import { Redis } from 'ioredis';
import { CacheWrapper, logger } from 'wraps-cache';

import { RedisCacheConfiguration } from './interfaces';
import { redisCreate } from './RedisCreate';
import { convertToJson, convertToString, RedisKeyOpts, RedisValue } from './RedisUtils';

export class RedisCache implements CacheWrapper {
  public client: Redis;
  public appKey: string;

  constructor(conf: RedisCacheConfiguration = {}) {
    this.appKey = conf.appKey || process.env.REDIS_APP_KEY;
    this.client = redisCreate() as Redis;
  }

  /**
   * Performs HGET over Redis
   * Gets a previously saved key
   *
   * @param namespace Hash key to use
   * @param key Key name
   */
  public async getKey(namespace: string, key: string): Promise<string> {
    const value: string = await this.client.hget(this.getAppNamespace(namespace), key);
    logger.silly(`getKey Value: ${value}`);
    return this.getRedisValues(namespace, key, value);
  }

  /**
   * Performs HGET over Redis and parses result to a Javascript Object type
   *
   * @param namespace Hash key
   * @param key Key name
   */
  public async getObjKey(namespace: string, key: string): Promise<any> {
    const stringValue = await this.getKey(namespace, key);
    return convertToJson(stringValue);
  }

  /**
   * Performs HSET over REDIS
   * @param namespace Hash key
   * @param key Key name
   * @param value Value to save. Can be any type except function
   * If param is an object type, it will br parsed automatically
   * @param options Saving options (RedisKeyOpts type)
   */
  public async saveKey(namespace: string, key: string, value: any, options: RedisKeyOpts = {}): Promise<boolean> {
    logger.silly('saveKey');
    const returnedVal = await this.client.hset(
      this.getAppNamespace(namespace),
      key,
      this.setRedisValue(value, options),
    );
    logger.silly(`saveKey Returned: ${returnedVal}`);
    return returnedVal === 1;
  }

  /**
   * Performs HDEL over REDIS
   * @param namespace hash key
   * @param key Key name
   */
  public async deleteKey(namespace: string, key: string): Promise<boolean> {
    const returnedVal = await this.client.hdel(this.getAppNamespace(namespace), key);
    logger.silly(`deleteKey Returned: ${returnedVal}`);
    return true;
  }

  /**
   * Performs HGETALL over REDIS
   * @param namespace Namespace to retrieve
   */
  public async getNamespace(namespace: string): Promise<any> {
    const values = await this.client.hgetall(this.getAppNamespace(namespace));
    logger.silly('getNamespace returned', values);
    return values;
  }

  /**
   * Performs DEL over REDIS (deletes all namespace entries)
   * @param namespace Namespace to delete
   */
  public async deleteNamespace(namespace: string): Promise<any> {
    const returnedVal = await this.client.del(this.getAppNamespace(namespace));
    logger.silly(`deleteNamespace returned ${returnedVal}`);
  }

  private getAppNamespace(namespace: string): string {
    return `${this.appKey}-${namespace}`;
  }

  /**
   * String/Object to internal format conversion
   * Encapsulates value into an internal object type (RedisValue)
   * @param value Value to be saved
   * @param opts Options (currently only expiresAt)
   */
  private setRedisValue(value: any, opts: RedisKeyOpts): string {
    let expirationDate: number | false = false;
    if (opts.expiresAt) expirationDate = Date.now() + opts.expiresAt * 1000;
    return JSON.stringify({
      expirationDate: expirationDate,
      value: convertToString(value),
    });
  }

  /**
   * Decode REDIS custom value structure into real value
   * Checks for expiration
   * @param namespace Value namespace
   * Will be used if key is expired
   * @param key Value Key
   * Will be used if key is expired
   * @param val Value
   */
  private getRedisValues(namespace: string, key: string, val: string | null): null | string {
    logger.silly(`Value from redis: ${val}`);
    if (val === null) return val;
    const formatedVal: RedisValue = JSON.parse(val);
    if (formatedVal.expirationDate && formatedVal.expirationDate < Date.now()) {
      logger.debug('Expired value. Delete key and return null');
      this.deleteKey(namespace, key);
      // tslint:disable-next-line:no-null-keyword
      return null;
    }
    return formatedVal.value;
  }
}
