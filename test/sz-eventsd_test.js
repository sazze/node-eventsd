process.env.SZ_APP_NAME = 'eventsd.test';
process.env.SZ_ENV = 'test';

var chai = require('chai');
var expect = chai.expect;
var dgram = require('dgram');
var timekeeper = require('timekeeper');
var freezed_time = new Date(1330688329321);
var os = require('os');

chai.config.includeStack = true;

var EventsD = require('../');

describe('eventsd', function () {
  beforeEach(function (done) {
    timekeeper.freeze(freezed_time);
    done();
  });

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
        "routingKey": "event.test.env.test.application.eventsdTest"
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
        expect(err).to.not.be.ok;
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
        "routingKey": "event.test.env.test.application.eventsdTest.another.keyValue"
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
        expect(err).to.not.be.ok;
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
    //    "routingKey": "event.test.env.test.application.eventsdTest"
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
        "routingKey": "event.test.env.test.application.eventsdTest"
      };

      test_server = createTestServer(port, function (data) {
        //response = JSON.parse(data);
        //console.log(response);
      });

      var events = new EventsD();

      events.send('test', {test: 'hello world'}, function (err) {
        expect(err).to.not.be.ok;

        events.send('test', {test: 'hello world 2'}, function (err) {
          expect(err).to.not.be.ok;
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
        "routingKey": "event.test.env.test.application.eventsdTest"
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
        expect(err).to.not.be.ok;
      });

      events.send('test', {test: 'hello world 2'}, function (err) {
        expect(err).to.not.be.ok;
      });

      events.send('test', {test: 'hello world 3'}, function (err) {
        expect(err).to.not.be.ok;
      });

      events.send('test', {test: 'hello world 4'}, function (err) {
        expect(err).to.not.be.ok;
      });

      events.send('test', {test: 'hello world 5'}, function (err) {
        expect(err).to.not.be.ok;
      });

      events.send('test', {test: 'hello world 6'}, function (err) {
        expect(err).to.not.be.ok;
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
        "routingKey": "event.test.env.test.application.eventsdTest"
      };

      test_server = createTestServer(port, function (data) {
        //response = JSON.parse(data);
        //console.log(response);
      });

      var events = new EventsD({autoClose: false});

      events.send('test', {test: 'hello world'}, function (err) {
        expect(err).to.not.be.ok;

        events.close();

        events.send('test', {test: 'hello world 2'}, function (err) {
          expect(err).to.not.be.ok;
          events.close();
          done();
        });
      });
    });

    // Teardown
    afterEach(function (done) {
      if (test_server) {
        test_server.close(function () {
          timekeeper.reset();
          test_server = null;
          done();
        });
      } else {
        timekeeper.reset();
        test_server = null;
      }
    });
  });

  it('escapes routing key parts', function () {
    var tests = [
      {test: 'some$^&*(@)Freaky\\Key', expected: 'someFreakyKey'},
      {test: 'example.com', expected: 'exampleCom'},
      {test: 'my-key_val1', expected: 'my-key_val1'}
    ];

    tests.forEach(function (test) {
      expect(EventsD.escapeRoutingKey(test.test)).to.equal(test.expected);
    });
  });

  it('builds routing key', function () {
    var tests = [
      {event: 'error', env: 'production', app: 'example', extra: [], expected: 'event.error.env.production.application.example'},
      {event: 'error', env: 'production', app: 'example', extra: ['errorType', 'warn'], expected: 'event.error.env.production.application.example.errorType.warn'},
      {event: 'err%or', env: 'prod#uction', app: 'exa!mple', extra: ['error!Type', 'warn!'], expected: 'event.error.env.production.application.example.errorType.warn'},
      {event: '', env: 'production', app: 'example', extra: [], expected: 'event.unknown.env.production.application.example'},
      {event: 'error', env: '', app: 'example', extra: [], expected: 'event.error.env.unknown.application.example'},
      {event: 'error', env: 'production', app: '', extra: [], expected: 'event.error.env.production.application.unknown'},
      {event: '', env: '', app: '', extra: [], expected: 'event.unknown.env.unknown.application.unknown'},
      {event: '', env: '', app: '', extra: '', expected: 'event.unknown.env.unknown.application.unknown'}
    ];

    tests.forEach(function (test) {
      expect(EventsD.getRoutingKey(test.event, test.env, test.app, test.extra)).to.equal(test.expected);
    });
  });

  it('builds eventsd envelope', function () {
    var tests = [
      {routingKey: 'event.error.env.production.application.example', msg: {foo: 'bar'}, expected: {time: 'Fri, 02 Mar 2012 11:38:49 GMT', microtime: 0.321, msg: {foo: 'bar'}, routingKey: 'event.error.env.production.application.example'}},
      {routingKey: 'event.error.env.production.application.example', msg: 'foo/bar', expected: {time: 'Fri, 02 Mar 2012 11:38:49 GMT', microtime: 0.321, msg: 'foo/bar', routingKey: 'event.error.env.production.application.example'}},
      {routingKey: 'event.error.env.production.application.example', msg: {foo: {bar: 'baz and some #$*@&@^#&!^&*(){} stuff'}}, expected: {time: 'Fri, 02 Mar 2012 11:38:49 GMT', microtime: 0.321, msg: {foo: {bar: 'baz and some #$*@&@^#&!^&*(){} stuff'}}, routingKey: 'event.error.env.production.application.example'}}
    ];

    tests.forEach(function (test) {
      var envelope = EventsD.getEnvelope(test.routingKey, test.msg);

      expect(envelope).to.have.property('id');
      expect(envelope.id).to.be.ok;

      delete envelope.id;

      expect(envelope).to.eql(test.expected);
    });
  });

  it('convert routing key to RegExp', function () {
    var tests = [
      {key: 'event.error.env.production.application.example', regexp: /^event\.error\.env\.production\.application\.example$/},
      {key: 'event.error.env.production.application.#', regexp: /^event\.error\.env\.production\.application\..+$/},
      {key: 'event.error.env.*.application.example', regexp: /^event\.error\.env\.[^\.]+\.application\.example$/},
      {key: 'event.error.env.*.application.*', regexp: /^event\.error\.env\.[^\.]+\.application\.[^\.]+$/},
      {key: 'event.error.env.*.application.#', regexp: /^event\.error\.env\.[^\.]+\.application\..+$/},
      {key: 'event.#.env.*.application.*', regexp: /^event\..+$/}
    ];

    tests.forEach(function (test) {
      expect(EventsD.getRoutingKeyRegExp(test.key)).to.eql(test.regexp);
    });
  });

  afterEach(function (done) {
    timekeeper.reset();
    done();
  });
});