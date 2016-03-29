
var dgram = require('dgram');
var crypto = require('crypto');
var _ = require('lodash');

function EventsD(options) {
    options = options || {};

    this.host = options.host || process.env.SZ_EVENTSD_HOST || '127.0.0.1';
    this.port = options.port || process.env.SZ_EVENTSD_PORT || 8150;
    this.application = options.appName || process.env.SZ_EVENTSD_APP_NAME || process.env.SZ_APP_NAME || process.title;
    this.environment = options.environment || process.env.SZ_EVENTSD_ENV || process.env.SZ_ENV || 'unknown';
    this.autoClose = true;  // persistent connections are not straight forward in error handling and udp sockets are cheap to make and destroy?

    this.client = null;
}

EventsD.getRoutingKeyRegExp = function (routingKey) {
  return new RegExp('^' + routingKey.replace(/\./g, '\\.').replace(/\*/g, '[^\\.]+').replace(/#.*$/, '.+') + '$');
};

EventsD.escapeRoutingKey = function (unsafe) {
  if (!_.isString(unsafe)) {
    unsafe = unsafe + '';
  }

  unsafe = unsafe.replace(/[^-\.\w]/g, '');

  return unsafe.replace(/\.(\w)?/g, function (match, p1) {
    if (p1) {
      return p1.toUpperCase();
    }

    return '';
  });
};

EventsD.getRoutingKey = function (event, env, app, extra) {
  var keyBase = [
    'event',
    EventsD.escapeRoutingKey(event) || 'unknown',
    'env',
    EventsD.escapeRoutingKey(env) || 'unknown',
    'application',
    EventsD.escapeRoutingKey(app) || 'unknown'
  ];

  if (_.isUndefined(extra) || !_.isArray(extra)) {
    extra = [];
  }

  if (extra.length > 0) {
    extra = _.flatten(extra);

    _.forEach(extra, function (val, index) {
      extra[index] = EventsD.escapeRoutingKey(val);
    }, this);
  }

  return keyBase.concat(extra).join('.');
};

EventsD.getEnvelope = function (routingKey, msg) {
  if (typeof msg === 'undefined') {
    msg = '';
  }

  var date = new Date();
  var seconds = date.getMilliseconds() / 1000.0;
  var timeString = date.toUTCString();

  return {
    time: timeString,
    microtime: seconds - parseInt(seconds),
    msg: msg,
    id: crypto.createHash('md5').update(timeString + JSON.stringify(msg), 'utf8').digest('hex').toLowerCase(),
    routingKey: routingKey
  };
};

module.exports = EventsD;

EventsD.prototype.escapeRoutingKey = function (unsafe) {
  return EventsD.escapeRoutingKey(unsafe);
};

EventsD.prototype.getRoutingKey = function (event, extra) {
  return EventsD.getRoutingKey(event, this.environment, this.application, extra);
};

EventsD.prototype.getRoutingKeyRegExp = function (routingKey) {
  return EventsD.getRoutingKeyRegExp(routingKey);
};

EventsD.prototype.connect = function() {
  if (this.client) {
    return;
  }

  this.client = dgram.createSocket('udp4');

  this.client.on('error', function (err) {
    // try to have some record somewhere that an event was not sent
    console.error(err.stack || err.message || err);
    this.close();
  }.bind(this));

  this.client.on('close', function () {
    this.client = null;
  }.bind(this));
};

EventsD.prototype.send = function(event, msg, routingKeyExtras, callback) {
  if (_.isFunction(msg)) {
    callback = msg;
    msg = '';
    routingKeyExtras = [];
  }

  if (_.isFunction(routingKeyExtras)) {
    callback = routingKeyExtras;
    routingKeyExtras = [];
  }

  if (!_.isFunction(callback)) {
    callback = _.noop;
  }

  var msgString = JSON.stringify(this.getEnvelope(this.getRoutingKey(event, routingKeyExtras), msg));

  this.sendMsg(msgString, function(err) {
    process.nextTick(function () {
      callback(err);
    });
  });
};

EventsD.prototype.getEnvelope = function (routingKey, msg) {
  return EventsD.getEnvelope(routingKey, msg);
};

EventsD.prototype.sendMsg = function(message, callback) {
  var buf = new Buffer(message);

  if (!_.isFunction(callback)) {
    callback = _.noop;
  }

  this.connect();

  this.client.send(buf, 0, buf.length, this.port, this.host, function (err, bytes) {
    if (this.autoClose) {
      this.close();
    }

    callback(err);
  }.bind(this));
};

EventsD.prototype.close = function () {
  if (this.client) {
    this.client.close();
  }
};