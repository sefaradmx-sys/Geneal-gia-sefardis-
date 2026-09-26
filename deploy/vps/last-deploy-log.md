# last-deploy-log

run=36274524312 status=success ref=cursor/osint-framework-vps-44dc at=2026-09-26T21:55:57Z

>> clonar catálogo 21:54:57
Cloning into '/tmp/osint-fw'...
>> ping ssh 21:54:57
Warning: Permanently added '[108.181.203.225]:10048' (ED25519) to the list of known hosts.
SSH_OK
vps-garga
administrator
>> rsync 21:54:59
>> instalar 21:55:04
>> nginx 21:55:06 red=garga_default caddy=garga-caddy-1
1.27-alpine: Pulling from library/nginx
Digest: sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10
Status: Image is up to date for nginx:1.27-alpine
docker.io/library/nginx:1.27-alpine
40437b97fadac070f8f185032693ad5dc5657173fae728ee4e14c366e14e70de
caddy_updated
>> caddy validate 21:55:09
{"level":"info","ts":1790459709.4343812,"msg":"using config from file","file":"/etc/caddy/Caddyfile"}
{"level":"info","ts":1790459709.4458706,"msg":"adapted config to JSON","adapter":"caddyfile"}
{"level":"info","ts":1790459709.4496582,"logger":"tls.cache.maintenance","msg":"started background certificate maintenance","cache":"0x12cd5ee4c700"}
{"level":"warn","ts":1790459709.4500625,"logger":"http.auto_https","msg":"server is listening only on the HTTP port, so no automatic HTTPS will be applied to this server","server_name":"srv0","http_port":80}
Valid configuration
{"level":"info","ts":1790459709.4532511,"logger":"http","msg":"servers shutting down with eternal grace period"}
{"level":"info","ts":1790459709.453828,"logger":"tls.cache.maintenance","msg":"stopped background certificate maintenance","cache":"0x12cd5ee4c700"}
>> caddy reload 21:55:09
{"level":"info","ts":1790459709.7603023,"msg":"using config from file","file":"/etc/caddy/Caddyfile"}
{"level":"info","ts":1790459709.7732315,"msg":"adapted config to JSON","adapter":"caddyfile"}
>> smoke 21:55:09
container_ip=172.19.0.12
HTTP/1.1 200 OK
Server: nginx/1.27.5
Date: Sat, 26 Sep 2026 21:55:09 GMT
Content-Type: text/html
Content-Length: 8186
Last-Modified: Sat, 26 Sep 2026 21:54:57 GMT
Connection: keep-alive
ETag: "6ab83f31-1ffa"
Accept-Ranges: bytes

direct_root:200
direct_osint:200
intento 1 → 200
arf_ok OSINT Framework
css:200
js:200
census:200
OSINT_OK http://127.0.0.1/osint/
LISTO http://108.181.203.225:10049/osint/
