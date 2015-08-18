process.env.SZ_APP_NAME = 'sz-eventsd.test';
process.env.SZ_ENV = 'test';

var chai = require('chai');
var expect = chai.expect;
var dgram = require('dgram');
var timekeeper = require('timekeeper');
var freezed_time = new Date(1330688329321);
var os = require('os');

chai.config.includeStack = true;

var EventsD = require('../');

describe('sz-eventsd', function () {
  function createTestServer(port, onMessage) {
    var server = dgram.createSocket('udp4');

    server.on("error", function (err) {
      console.log("server error:\n" + err.stack);
      server.close();
    });

    server.on("message", onMessage);

    server.on("listening", function () {
      //var address = server.address();
      //console.log("server listening " +
      //  address.address + ":" + address.port);
    });

    server.bind(port);

    return server;
  }

  describe('with eventsd server', function () {
    var test_server, port = 8150;

    beforeEach(function (done) {
      timekeeper.freeze(freezed_time);
      done();
    });

    it('send events over UDP as valid json', function (done) {
      var response;
      var expected = {
        "time": "Fri, 02 Mar 2012 11:38:49 GMT",
        "microtime": 0.321,
        "msg": {
          "test": "hello world"
        },
        "routingKey": "event.test.env.test.application.sz-eventsdTest"
      };

      test_server = createTestServer(port, function (data) {
        response = JSON.parse(data);

        //console.log(response);

        delete response.id;

        expect(response).to.be.eql(expected);

        done();
      });

      var events = new EventsD();

      events.send('test', {test: 'hello world'}, function (err) {
        expect(err).to.equal(null);
      });
    });

    it('send events with complex routing keys', function (done) {
      var response;
      var expected = {
        "time": "Fri, 02 Mar 2012 11:38:49 GMT",
        "microtime": 0.321,
        "msg": {
          "test": "hello world"
        },
        "routingKey": "event.test.env.test.application.sz-eventsdTest.another.keyValue"
      };

      test_server = createTestServer(port, function (data) {
        response = JSON.parse(data);

        //console.log(response);

        delete response.id;

        expect(response).to.be.eql(expected);

        done();
      });

      var events = new EventsD();

      events.send('test', {test: 'hello world'}, ['another', '{!@#$% key.value ^&*()}'], function (err) {
        expect(err).to.equal(null);
      });
    });

    // reusing the connection maybe not a good idea?
    //
    //it('reuse the connection', function (done) {
    //  var response;
    //  var expected = {
    //    "time": "Fri, 02 Mar 2012 11:38:49 GMT",
    //    "microtime": 0.321,
    //    "msg": {
    //      "test": "hello world"
    //    },
    //    "routingKey": "event.test.env.test.application.sz-eventsdTest"
    //  };
    //
    //  test_server = createTestServer(port, function (data) {
    //    //response = JSON.parse(data);
    //    //console.log(response);
    //  });
    //
    //  var events = new EventsD({autoClose: false});
    //
    //  events.send('test', {test: 'hello world'}, function (err) {
    //    expect(err).to.equal(null);
    //
    //    events.send('test', {test: 'hello world 2'}, function (err) {
    //      expect(err).to.equal(null);
    //      events.close();
    //      done();
    //    });
    //  });
    //});

    it('reuse the eventsd object', function (done) {
      var response;
      var expected = {
        "time": "Fri, 02 Mar 2012 11:38:49 GMT",
        "microtime": 0.321,
        "msg": {
          "test": "hello world"
        },
        "routingKey": "event.test.env.test.application.sz-eventsdTest"
      };

      test_server = createTestServer(port, function (data) {
        //response = JSON.parse(data);
        //console.log(response);
      });

      var events = new EventsD();

      events.send('test', {test: 'hello world'}, function (err) {
        expect(err).to.equal(null);

        events.send('test', {test: 'hello world 2'}, function (err) {
          expect(err).to.equal(null);
          done();
        });
      });
    });

    it('send events without waiting', function (done) {
      var response;
      var expected = {
        "time": "Fri, 02 Mar 2012 11:38:49 GMT",
        "microtime": 0.321,
        "msg": {
          "test": "hello world"
        },
        "routingKey": "event.test.env.test.application.sz-eventsdTest"
      };

      var numSent = 0;

      test_server = createTestServer(port, function (data) {
        //response = JSON.parse(data);
        //console.log(response);
        numSent++;

        if (numSent >= 6) {
          done();
        }
      });

      var events = new EventsD();

      events.send('test', {test: 'hello world'}, function (err) {
        expect(err).to.equal(null);
      });

      events.send('test', {test: 'hello world 2'}, function (err) {
        expect(err).to.equal(null);
      });

      events.send('test', {test: 'hello world 3'}, function (err) {
        expect(err).to.equal(null);
      });

      events.send('test', {test: 'hello world 4'}, function (err) {
        expect(err).to.equal(null);
      });

      events.send('test', {test: 'hello world 5'}, function (err) {
        expect(err).to.equal(null);
      });

      events.send('test', {test: 'hello world 6'}, function (err) {
        expect(err).to.equal(null);
      });
    });

    it('handles connection interuptions', function (done) {
      var response;
      var expected = {
        "time": "Fri, 02 Mar 2012 11:38:49 GMT",
        "microtime": 0.321,
        "msg": {
          "test": "hello world"
        },
        "routingKey": "event.test.env.test.application.sz-eventsdTest"
      };

      test_server = createTestServer(port, function (data) {
        //response = JSON.parse(data);
        //console.log(response);
      });

      var events = new EventsD({autoClose: false});

      events.send('test', {test: 'hello world'}, function (err) {
        expect(err).to.equal(null);

        events.close();

        events.send('test', {test: 'hello world 2'}, function (err) {
          expect(err).to.equal(null);
          events.close();
          done();
        });
      });
    });

    // Teardown
    afterEach(function () {
      if (test_server) {
        test_server.close(function () {
        });
      }
      timekeeper.reset();
      test_server = null;
    });
  });
});