# Retrieve the blocking list and sever the pac file

## Configuration

The current config.json is as follows:

```
{
    "srvport": 3000,
    "listUrl": "https://raw.xxxxxxx.com/list/list/master/list.txt",
    "proxy": {
        "protocol": "http",
        "host": "192.168.3.28",
        "port": 23205
    },
    "pacExpiry": 1440,
    "exclude": [
        "localhost",
        "127.0.0.1"
    ],
    "predefined": [
        "google.com"
    ]
}
```

The `listUrl` is the source of the blocking list. It should be a valid URL that returns a BASE64 encoded [AutoProxy] formatted blocking list.

The `srvport` is the port on which the server should listen.

The `proxy.protocol` is now ignored. It might be supported in the future. The current implementation only supports `http` proxy. Which means the `proxy.host` and `proxy.port` are required and the PAC only has a `PROXY host:port` as the `proxy_yes` variable.

The `pacExpiry` is the time in minutes for which the PAC file should be cached.

The `exclude` is an array of domains that should be excluded from the blocking list.

The `predefined` is an array of domains that should be included in the blocking list. It will be merged with the blocking list obtained from the `listUrl`.

**The blocking list is obtained from the `listUrl`. And it is fetched through the proxy which is provided by the `proxy` configuration. That means if the proxy is not available, the blocking list will not be fetched.**

## Development

It has been tested with the Nodejs 20.

`npm install` to install the dependencies. This is an one time step.

`npm run start` can start the server and listening on the `srvport`.

The PAC file is served at `http://<srvhost>:<srvport>/proxy/pac`.

The `curl -v http://localhost:3000/proxy/pac` can be used to retrieve the PAC file for your local testing.

## Deployment on Linux

To serve the PAC as a HTTP service, here is an example for the user level systemd service control file:

```
[Unit]
Description=PAC proxy config service
Documentation=
StartLimitIntervalSec=60
StartLimitBurst=4

[Service]
ExecStart=/home/<user>/.nodenv/shims/npm run start
WorkingDirectory=/home/<user>/pac/paclist
StandardOutput=append:/home/<user>/pac/logs/paclist.logs
StandardError=append:/home/<user>/pac/logs/paclist_error.logs
Restart=on-failure
RestartSec=1
SuccessExitStatus=3 4
RestartForceExitStatus=3 4

# Hardening
SystemCallArchitectures=native
NoNewPrivileges=true

[Install]
WantedBy=default.target
```

It should be placed in `$HOME/.config/systemd/user` and then `systemctl --user daemon-reload` to reload the user level services.

To start the service, `systemctl --user start paclist.service`. 

And `systemctl --user status paclist.service` to check the status.

`systemctl --user enable paclist.service` to enable the service to start on boot.

For the user level systemd service, the logs are stored in `/home/<user>/pac/logs/paclist.logs` and `/home/<user>/pac/logs/paclist_error.logs`.

For how to enable the current user to start the user level systemd service, there are more steps needed. Please refer to the official documentation: https://wiki.archlinux.org/index.php/Systemd/User.