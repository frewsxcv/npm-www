var AtomicJSON = require("./atomic-json").AtomicJSON;

// wrap redisClient with helpers for performing
// atomic operations on Redis.
exports.wrap = function(redisClient) {
  return (new AtomicJSON()).wrap(redisClient)
}
