Redis Atomic JSON
=================

Build Status: [![Build Status](https://travis-ci.org/npm/redis-atomic-json.png)](https://travis-ci.org/npm/redis-atomic-json)

Wraps [node_redis](https://github.com/mranney/node_redis), adding the support for atomic updates to JSON blobs.

Usage
-----

Simply create an instance of a redis client, and use _redis-atomic-json_ to wrap it:

```javascript
var redis = require('redis'),
  client = redis.createClient(),
  client = require('redis-atomic-json').wrap(client);
```

Wrapping the client will add the following methods:

jgetall
-------

Return the object stored as a JSON string:

```javascript
client.jgetall('my-json-blob');
```

jset
----

Atomically set a field on a JSON blob:

```javascript
client.jset('my-json-blob', 'newKey', 33.5);

// or.

client.jset('my-json-blob', {newKey: 33.5})
```

jdel
----

Atomically delete a field on a JSON blob:

```javascript
client.jdel('my-json-blob', 'newKey');
```
