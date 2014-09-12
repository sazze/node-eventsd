## Configuration

* `host`
    * The host location of the EventsD server.
    * Default: `SZ_EVENTSD_HOST | '127.0.0.1'`
* `port`
    * The host port to connect.
    * Default: `SZ_EVENTSD_HOST | 8150`
* `appName`
    * The name of the application sending events.
    * Default: `SZ_EVENTSD_APP_NAME | SZ_APP_NAME | process.title`
* `environment`
    * The name of the application's environment.
    * Default: `SZ_EVENTSD_ENV | SZ_ENV | 'unknown'`
