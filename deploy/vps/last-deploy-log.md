# last-deploy-log

run=36274266300 status=failure ref=cursor/osint-framework-vps-44dc at=2026-09-26T21:50:51Z

>> clonar catálogo 21:50:19
Cloning into '/tmp/osint-fw'...
>> ping ssh 21:50:20
Warning: Permanently added '[108.181.203.225]:10048' (ED25519) to the list of known hosts.
SSH_OK
vps-garga
administrator
>> rsync 21:50:21
>> instalar 21:50:25
>> nginx 21:50:28 red=garga_default caddy=garga-caddy-1
1.27-alpine: Pulling from library/nginx
39c2ddfd6010: Pulling fs layer
f18232174bc9: Pulling fs layer
61ca4f733c80: Pulling fs layer
b464cfdf2a63: Pulling fs layer
d7e507024086: Pulling fs layer
81bd8ed7ec67: Pulling fs layer
197eb75867ef: Pulling fs layer
34a64644b756: Pulling fs layer
197eb75867ef: Download complete
61ca4f733c80: Download complete
81bd8ed7ec67: Download complete
34a64644b756: Download complete
b464cfdf2a63: Download complete
d7e507024086: Download complete
2a84448aca9c: Download complete
f18232174bc9: Download complete
9261b9aff737: Download complete
39c2ddfd6010: Download complete
f18232174bc9: Pull complete
61ca4f733c80: Pull complete
b464cfdf2a63: Pull complete
d7e507024086: Pull complete
81bd8ed7ec67: Pull complete
197eb75867ef: Pull complete
34a64644b756: Pull complete
39c2ddfd6010: Pull complete
Digest: sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10
Status: Downloaded newer image for nginx:1.27-alpine
docker.io/library/nginx:1.27-alpine
7b2f5c0c3cb4833d385f5de983d5c7501cd0becfd15e123547d263afb5151de4
caddy_updated
>> caddy validate 21:50:37
{"level":"info","ts":1790459438.165225,"msg":"using config from file","file":"/etc/caddy/Caddyfile"}
{"level":"info","ts":1790459438.1701548,"msg":"adapted config to JSON","adapter":"caddyfile"}
{"level":"warn","ts":1790459438.1737127,"logger":"http.auto_https","msg":"server is listening only on the HTTP port, so no automatic HTTPS will be applied to this server","server_name":"srv0","http_port":80}
{"level":"info","ts":1790459438.1747618,"logger":"tls.cache.maintenance","msg":"started background certificate maintenance","cache":"0x3dab5c7e2480"}
{"level":"info","ts":1790459438.1819842,"logger":"http","msg":"servers shutting down with eternal grace period"}
{"level":"info","ts":1790459438.1845684,"logger":"tls.cache.maintenance","msg":"stopped background certificate maintenance","cache":"0x3dab5c7e2480"}
Valid configuration
>> caddy reload 21:50:38
{"level":"info","ts":1790459438.52816,"msg":"using config from file","file":"/etc/caddy/Caddyfile"}
{"level":"info","ts":1790459438.535511,"msg":"adapted config to JSON","adapter":"caddyfile"}
>> smoke 21:50:38
intento 1 → 404
intento 2 → 404
intento 3 → 404
intento 4 → 404
intento 5 → 404
intento 6 → 404
