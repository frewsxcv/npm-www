var Lab = require('lab'),
  Promise = require("bluebird"),
  redis = require('redis'),
  client = redis.createClient(),
  client = require('../lib').wrap(client),
  jsonKey = "foo";

Lab.experiment('jgetall', function () {

  Lab.test('it returns an empty object for a key that does not exist', function (done) {
    del(jsonKey).then(function() {
      return jgetall(jsonKey);
    }).then(function(value) {
      Lab.expect(value).to.deep.equal({});
      done();
    }).done();
  });

  Lab.test('it returns object from JSON string', function (done) {
    var expected = {
      foo: 'bar',
      a: 'b'
    };

    del(jsonKey).then(function() {
      return set(jsonKey, expected);
    }).then(function() {
      return jgetall(jsonKey);
    }).then(function(value) {
      Lab.expect(value).to.deep.equal(expected);
      done();
    }).done();
  });

});

Lab.experiment('jset', function () {
  Lab.test('it can set key on JSON string that does not yet exist', function (done) {
    var expected = {
      foo: 'bar'
    };

    del(jsonKey).then(function() {
      return jset(jsonKey, 'foo', 'bar');
    }).then(function() {
      return jgetall(jsonKey);
    }).then(function(value) {
      Lab.expect(value).to.deep.equal(expected);
      done();
    }).done();
  });

  Lab.test('it can populate a session with a hash rather than a key and value', function (done) {
    var expected = {
      foo: 'bar'
    };

    del(jsonKey).then(function() {
      return jset(jsonKey, expected);
    }).then(function() {
      return jgetall(jsonKey);
    }).then(function(value) {
      Lab.expect(value).to.deep.equal(expected);
      done();
    }).done();
  });

  Lab.test('it can update a JSON object that already exists', function(done) {
    var expected = {
      foo: 'bar',
      bar: 33
    };

    del(jsonKey).then(function() {
      return set(jsonKey, {foo: 'bar'});
    }).then(function() {
      return jset(jsonKey, 'bar', 33);
    }).then(function() {
      return jgetall(jsonKey);
    }).then(function(value) {
      Lab.expect(value).to.deep.equal(expected);
      done();
    }).done();
  });

  Lab.test('it can perform many updates at once without causing race', function(done) {
    var expected = {
      '0': 0,
      '1': 2,
      '2': 4,
      '3': 6
    };

    del(jsonKey).then(function() {
      return Promise.all(
        [0, 1, 2, 3].map(function(val) {
          return jset(jsonKey, '' + val, val * 2);
        })
      );
    }).then(function() {
      return jgetall(jsonKey);
    }).then(function(value) {
      Lab.expect(value).to.deep.equal(expected);
      done();
    }).done();
  });
});

Lab.experiment('jdel', function () {
  Lab.test('it can try to delete a key on a JSON object that does not exist', function(done) {
    del(jsonKey).then(function() {
      return jdel(jsonKey, 'foo');
    }).then(function() {
      return jgetall(jsonKey);
    }).then(function(value) {
      Lab.expect(value).to.deep.equal({});
      done();
    }).done();
  });

  Lab.test('it can delete a key on a JSON string', function(done) {
    del(jsonKey).then(function() {
      return jset(jsonKey, 'foo', 22.5)
    }).then(function() {
      return jdel(jsonKey, 'foo');
    }).then(function() {
      return jgetall(jsonKey);
    }).then(function(value) {
      Lab.expect(value).to.deep.equal({});
      done();
    }).done();
  });
});

// Test helpers.
function del(key) {
  return new Promise(function (resolve, reject) {
    client.del(key, function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function set(key, value) {
  return new Promise(function (resolve, reject) {
    client.set(key, JSON.stringify(value), function(err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

function jgetall(key) {
  return new Promise(function (resolve, reject) {
    client.jgetall(key, function(err, value) {
      if (err) reject(err);
      else resolve(value);
    });
  });
}

function jset(json, key, value) {
  return new Promise(function (resolve, reject) {
    // Sleep a random # of ms, to encourage timing
    // issues.
    setTimeout(function() {
      if (typeof value === 'undefined') {
        client.jset(json, key, function(err) {
          if (err) reject(err);
          else resolve();
        });
      } else {
        client.jset(json, key, value, function(err) {
          if (err) reject(err);
          else resolve();
        });
      }
    }, Math.random() * 100);
  });
}

function jdel(json, key) {
  return new Promise(function (resolve, reject) {
    // Sleep a random # of ms, to encourage timing
    // issues.
    setTimeout(function() {
      client.jdel(json, key, function(err) {
        if (err) reject(err);
        else resolve();
      });
    }, Math.random() * 100);
  });
}
