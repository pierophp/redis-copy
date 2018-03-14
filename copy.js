const { promisify } = require('util');
const redis = require('redis');

if (!process.argv[2]) {
  console.log('Set the source Redis');
  process.exit();
}

if (!process.argv[3]) {
  console.log('Set the target Redis');
  process.exit();
}

const sourceSplit = process.argv[2].split(':');
const targetSplit = process.argv[3].split(':');

const sourceRedisHost = sourceSplit[0];
const sourceRedisPort = sourceSplit[1] || 6379;
const sourceRedisDb = sourceSplit[2] || 0;

const targetRedisHost = targetSplit[0];
const targetRedisPort = targetSplit[1] || 6379;
const targetRedisDb = targetSplit[2] || 0;

const sourceRedisClient = redis.createClient({
  host: sourceRedisHost,
  port: sourceRedisPort,
  db: sourceRedisDb,
});

const targetRedisClient = redis.createClient({
  host: targetRedisHost,
  port: targetRedisPort,
  db: targetRedisDb,
});

const sourceKeys = promisify(sourceRedisClient.KEYS).bind(sourceRedisClient);
const sourceGet = promisify(sourceRedisClient.GET).bind(sourceRedisClient);
const targetSet = promisify(targetRedisClient.SET).bind(targetRedisClient);

(async function boot() {
  const keys = await sourceKeys('*');

  for (const key of keys) {
    const value = await sourceGet(key);

    await targetSet(key, value);
  }

  process.exit();
})();
