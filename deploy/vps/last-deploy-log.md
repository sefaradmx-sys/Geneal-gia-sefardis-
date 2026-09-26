# last-deploy-log

run=36277013628 status=success ref=cursor/osint-framework-vps-44dc at=2026-09-26T22:41:24Z

>> clonar catálogo 22:40:19
Cloning into '/tmp/osint-fw'...
query_search_injected
>> ping ssh 22:40:19
Warning: Permanently added '[108.181.203.225]:10048' (ED25519) to the list of known hosts.
SSH_OK
vps-garga
administrator
>> rsync 22:40:20
>> instalar 22:40:25
>> nginx 22:40:27 red=garga_default caddy=garga-caddy-1
1.27-alpine: Pulling from library/nginx
Digest: sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10
Status: Image is up to date for nginx:1.27-alpine
docker.io/library/nginx:1.27-alpine
>> puertos 22:40:29
State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
LISTEN 0      4096         0.0.0.0:3091       0.0.0.0:*          
LISTEN 0      4096         0.0.0.0:3090       0.0.0.0:*          
LISTEN 0      4096         0.0.0.0:3092       0.0.0.0:*          
LISTEN 0      4096         0.0.0.0:5678       0.0.0.0:*          
LISTEN 0      4096         0.0.0.0:18000      0.0.0.0:*          
LISTEN 0      4096   127.0.0.53%lo:53         0.0.0.0:*          
LISTEN 0      4096         0.0.0.0:8081       0.0.0.0:*          
LISTEN 0      4096         0.0.0.0:8080       0.0.0.0:*          
LISTEN 0      128        127.0.0.1:631        0.0.0.0:*          
LISTEN 0      128          0.0.0.0:22         0.0.0.0:*          
LISTEN 0      4096         0.0.0.0:80         0.0.0.0:*          
LISTEN 0      4096         0.0.0.0:443        0.0.0.0:*          
LISTEN 0      4096            [::]:3091          [::]:*          
LISTEN 0      4096            [::]:3090          [::]:*          
LISTEN 0      4096            [::]:3092          [::]:*          
LISTEN 0      2                  *:1097             *:*          
LISTEN 0      4096            [::]:5678          [::]:*          
LISTEN 0      4096            [::]:18000         [::]:*          
LISTEN 0      2              [::1]:3350          [::]:*          
LISTEN 0      4096            [::]:8081          [::]:*          
LISTEN 0      4096            [::]:8080          [::]:*          
LISTEN 0      128             [::]:22            [::]:*          
LISTEN 0      4096            [::]:80            [::]:*          
LISTEN 0      128            [::1]:631           [::]:*          
LISTEN 0      4096            [::]:443           [::]:*          
puerto 8000 libre
e2e0b0901353241e14f44fd85108d7e337f48eb2770bbb41cf7d8d8162d490a6
caddy_unchanged
>> caddy validate 22:40:30
{"level":"info","ts":1790462430.4349642,"msg":"using config from file","file":"/etc/caddy/Caddyfile"}
{"level":"info","ts":1790462430.4423797,"msg":"adapted config to JSON","adapter":"caddyfile"}
{"level":"info","ts":1790462430.4526825,"logger":"tls.cache.maintenance","msg":"started background certificate maintenance","cache":"0x72aa2012180"}
{"level":"warn","ts":1790462430.4533617,"logger":"http.auto_https","msg":"server is listening only on the HTTP port, so no automatic HTTPS will be applied to this server","server_name":"srv0","http_port":80}
{"level":"info","ts":1790462430.4566512,"logger":"http","msg":"servers shutting down with eternal grace period"}
{"level":"info","ts":1790462430.4568112,"logger":"tls.cache.maintenance","msg":"stopped background certificate maintenance","cache":"0x72aa2012180"}
Valid configuration
>> caddy reload 22:40:30
{"level":"info","ts":1790462430.7222147,"msg":"using config from file","file":"/etc/caddy/Caddyfile"}
{"level":"info","ts":1790462430.7272108,"msg":"adapted config to JSON","adapter":"caddyfile"}
>> smoke 22:40:30
container_ip=172.19.0.12
HTTP/1.1 200 OK
Server: nginx/1.27.5
Date: Sat, 26 Sep 2026 22:40:30 GMT
Content-Type: text/html
Content-Length: 8233
Last-Modified: Sat, 26 Sep 2026 22:40:19 GMT
Connection: keep-alive
ETag: "6ab849d3-2029"
Accept-Ranges: bytes

direct_root:200
direct_osint:200
intento 1 → 200
arf_ok OSINT Framework
css:200
js:200
census:200
api:200
local_port:8000:200
OSINT_OK http://127.0.0.1/osint/
>> url pública 22:40:31
public_index:200
public_arf:200
public_css:200
public_js:200
public_query_js:200
public_api:200
public_census:200
LISTO http://108.181.203.225:10049/osint/
