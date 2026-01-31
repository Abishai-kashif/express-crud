const { Redis } = require('@upstash/redis');

class RedisClient {
  constructor() {
    this.redis = new Redis({
      url: process.env.REDIS_URL,
      token: process.env.REDIS_TOKEN
    });
  }

  async setCache(key, value, ttl = 60) {
    await this.redis.set(key, JSON.stringify(value), { ex: ttl });
  }
  
  async getCache(key) {
    const data = await this.redis.get(key);
    return data ? typeof data === 'string' ? JSON.parse(data): data : null;
  }

  async delCache(key) {
    await this.redis.del(key);
  }
}

module.exports = RedisClient;