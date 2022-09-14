const { Cluster } = require('ioredis');

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

const targetRedisHost = targetSplit[0];
const targetRedisPort = targetSplit[1] || 6379;

const sourceRedisClient = new Cluster(
  [
    {
      host: sourceRedisHost,
      port: sourceRedisPort,
    },
  ],
  {
    maxRetriesPerRequest: 2,
  },
);

const targetRedisClient = new Cluster(
  [
    {
      host: targetRedisHost,
      port: targetRedisPort,
    },
  ],

  { maxRetriesPerRequest: 2 },
);

(async function boot() {
  try {
    await new Promise((resolve) => {
      sourceRedisClient.on('ready', () => {
        resolve();
      });
    });

    await new Promise((resolve) => {
      targetRedisClient.on('ready', () => {
        resolve();
      });
    });

    const keys = await sourceRedisClient.keys('*');

    console.log(`${keys.length} keys found`);

    let i = 0;

    for (const key of keys) {
      i++;
      if (i % 10 === 0) {
        console.log(`Copying ${i}`);
      }

      try {
        const value = await sourceRedisClient.get(key);

        console.log({ key, value });

        await targetRedisClient.set(key, value);
      } catch (e) {
        console.error(e);
        continue;
      }
    }
  } catch (e) {
    console.error(e);
  }

  process.exit();
})();
