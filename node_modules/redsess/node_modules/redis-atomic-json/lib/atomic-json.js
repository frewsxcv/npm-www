// Adds useful constructs for performing atomic
// modifications of JSON in Redis.
function AtomicJSON() {}

AtomicJSON.prototype.wrap = function(redisClient) {
  this.redisClient = redisClient;

  // Add JSON extensions to Redis client.
  redisClient.jgetall = function(json, cb) {
    this.jgetall(json, cb);
  }.bind(this);

  redisClient.jset = function(json, key, value, cb) {
    this.jset(json, key, value, cb);
  }.bind(this);

  redisClient.jdel = function(json, key, cb) {
    this.jdel(json, key, cb);
  }.bind(this);

  return redisClient;
};

// return the object representation of a stored JSON string.
AtomicJSON.prototype.jgetall = function(json, cb) {
  this.redisClient.get(json, function(err, value) {
    if (err) {
      cb(err);
    } else {
      try {
        cb(null, JSON.parse(value) || {});
      } catch (e) {
        cb(e);
      }
    }
  });
};

// Atomically set the key on a stored JSON string.
AtomicJSON.prototype.jset = function(json, key, value, cb) {
  var obj = {};

  // Allow for .jset(id, {}) and .jset(id, key, value)
  if (typeof value === 'function') {
    cb = value, obj = key;
  } else {
    obj[key] = value;
  }

  this.redisClient.eval([_jsetLua(), 1, json, JSON.stringify(obj)], cb);
};

function _jsetLua() {
  return "local key = KEYS[1];\
    local t1 = redis.call('get',  key);\
    if t1 then t1 = cjson.decode(t1) else t1 = {} end;\
    local t2 = cjson.decode(ARGV[1]);\
    for k,v in pairs(t2) do t1[k] = v end;\
    redis.call('set', key, cjson.encode(t1));";
}

// Atomically unset a key on a stored JSON string.
AtomicJSON.prototype.jdel = function(json, key, cb) {
  this.redisClient.eval([_jdelLua(), 1, json, key], cb);
};

function _jdelLua() {
  return "local key = KEYS[1];\
    local t1 = redis.call('get',  key);\
    if t1 then t1 = cjson.decode(t1) else t1 = {} end;\
    t1[ARGV[1]] = nil;\
    redis.call('set', key, cjson.encode(t1));";
}

exports.AtomicJSON = AtomicJSON;
