// utils/cache.js
import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 300,
  checkperiod: 60
});

export const getCacheKey = (prefix, params) => {
  return `${prefix}_${JSON.stringify(params)}`;
};

export default cache;