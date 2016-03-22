eventsd
====================

A library for interfacing with EventsD

Usage
====================

``` js
    var EventsD = require('eventsd');

    var events = new EventsD();

    events.send('myEvent', 'some message', function (err) {
      if (err) {
        // an error occurred
      }

      // do something after event was sent
    });
```

## Options

``` js
    var options = {
      host: '127.0.0.1',
      port: 8150,
      appName: 'myApp',
      environment: 'development'
    };

    var events = new EventsD(options);
```

* `host`
    * The host location of the EventsD server.
    * Default: `SZ_EVENTSD_HOST | '127.0.0.1'`
* `port`
    * The host port to connect.
    * Default: `SZ_EVENTSD_HOST | 8150`
* `appName`
    * The name of the application sending events.
    * Default: `SZ_EVENTSD_APP_NAME | SZ_APP_NAME | process.title | 'unknown'`
* `environment`
    * The name of the application's environment.
    * Default: `SZ_EVENTSD_ENV | SZ_ENV | 'unknown'`

## Environment Variables

Environment variables set default values for the EventsD options.  Override them by passing options to `new EventsD()`

```
SZ_EVENTSD_HOST: the EventsD host to connect to
SZ_EVENTSD_PORT: the port the EventsD server is listening on
SZ_EVENTSD_APP_NAME | SZ_APP_NAME: the name of the application sending the event
SZ_EVENTSD_ENV | SZ_ENV: the name of the environment that the event is in
```

Run Tests
====================

```
  npm test
```

====================

#### Author: [Craig Thayer](https://githum.com/cthayer)

#### License: ISC

See LICENSE for the full license text.

