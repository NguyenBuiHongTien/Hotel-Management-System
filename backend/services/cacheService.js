const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 600 }); // 10 phút

const getCache = (key) => {
  return cache.get(key);
};

const setCache = (key, value, ttl = 600) => {
  return cache.set(key, value, ttl);
};

const deleteCache = (key) => {
  return cache.del(key);
};

module.exports = { getCache, setCache, deleteCache };