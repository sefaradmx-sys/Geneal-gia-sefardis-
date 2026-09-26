# last-deploy-log

run=36262212770 status=failure ref=cursor/database-mart-acceso-a5bc at=2026-09-26T18:24:27Z

>> ping ssh 18:21:01
Warning: Permanently added '[108.181.203.225]:10048' (ED25519) to the list of known hosts.
SSH_OK
vps-garga
administrator
Docker version 29.8.1, build 4a63305
/dev/vda3        64G   27G   34G  45% /
               total        used        free      shared  buff/cache   available
Mem:            3916        1215         798          38        1903        2376
>> rsync 18:21:02
>> escribe scripts remotos 18:21:04
env_ok /opt/garga/apps/la-mv-census/deploy/vps/.env
caddy_unchanged
USING:docker compose
>> build api 18:21:10
--progress is a global compose flag, better use `docker compose --progress xx build ...
 Image lmc-api Building 
#1 [internal] load local bake definitions
#1 reading from stdin 497B done
#1 DONE 0.0s

#2 [internal] load build definition from Dockerfile
#2 transferring dockerfile: 662B 0.0s done
#2 DONE 0.0s

#3 [internal] load metadata for docker.io/library/python:3.12-slim
#3 DONE 0.5s

#4 [internal] load .dockerignore
#4 transferring context: 113B done
#4 DONE 0.0s

#5 [internal] load build context
#5 DONE 0.0s

#6 [ 1/11] FROM docker.io/library/python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
#6 resolve docker.io/library/python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f 0.1s done
#6 DONE 0.2s

#5 [internal] load build context
#5 transferring context: 3.56MB 0.4s done
#5 DONE 0.4s

#7 [ 4/11] COPY apps/api/requirements.txt /opt/la-mv-census/requirements.txt
#7 CACHED

#8 [10/11] COPY apps/api/entrypoint.sh /entrypoint.sh
#8 CACHED

#9 [ 2/11] WORKDIR /opt/la-mv-census
#9 CACHED

#10 [ 6/11] COPY apps/api /opt/la-mv-census
#10 CACHED

#11 [ 8/11] COPY data /opt/la-mv-census/data
#11 CACHED

#12 [ 3/11] RUN apt-get update && apt-get install -y --no-install-recommends libpq5     && rm -rf /var/lib/apt/lists/*
#12 CACHED

#13 [ 5/11] RUN pip install --no-cache-dir -r requirements.txt
#13 CACHED

#14 [ 7/11] COPY apps/collector/src/collector /opt/la-mv-census/collector
#14 CACHED

#15 [ 9/11] COPY scripts/load_anahuac_study.py /opt/la-mv-census/load_anahuac_study.py
#15 CACHED

#16 [11/11] RUN chmod +x /entrypoint.sh
#16 CACHED

#17 exporting to image
#17 exporting layers 0.1s done
#17 exporting manifest sha256:fe7fe26e324a6e25a15a84a83623010b5b5a58caa03d9792da2579fe6212eb64 0.0s done
#17 exporting config sha256:4c7f2b2d03ab042a26e607fcca2b5b61e83c1a11e87fcae4b2cf38240b8f09c3 done
#17 exporting attestation manifest sha256:6bdff7de6459b05bc86e21b2df1036e91bc57bfdcba5a48ec23201b0ec948c42
#17 exporting attestation manifest sha256:6bdff7de6459b05bc86e21b2df1036e91bc57bfdcba5a48ec23201b0ec948c42 0.1s done
#17 exporting manifest list sha256:27afb19635873986607343c07f582bf108f5d8ec58ac665e4820d0dbcbe1373f 0.1s done
#17 naming to docker.io/library/lmc-api:latest
#17 naming to docker.io/library/lmc-api:latest done
#17 unpacking to docker.io/library/lmc-api:latest
#17 unpacking to docker.io/library/lmc-api:latest 0.2s done
#17 DONE 0.7s

#18 resolving provenance for metadata file
#18 DONE 0.0s
 Image lmc-api Built 
>> build web 18:21:13
--progress is a global compose flag, better use `docker compose --progress xx build ...
 Image lmc-web Building 
#1 [internal] load local bake definitions
#1 reading from stdin 953B done
#1 DONE 0.0s

#2 [internal] load build definition from Dockerfile
#2 transferring dockerfile: 549B done
#2 DONE 0.0s

#3 [internal] load metadata for docker.io/library/node:22-alpine
#3 DONE 0.4s

#4 [internal] load .dockerignore
#4 transferring context: 113B done
#4 DONE 0.0s

#5 [internal] load build context
#5 DONE 0.0s

#6 [build 1/6] FROM docker.io/library/node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402
#6 resolve docker.io/library/node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402
#6 resolve docker.io/library/node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 0.1s done
#6 DONE 0.1s

#5 [internal] load build context
#5 transferring context: 255.98kB 0.1s done
#5 DONE 0.1s

#7 [build 2/6] WORKDIR /app
#7 CACHED

#8 [build 3/6] COPY apps/web/package.json apps/web/package-lock.json ./
#8 CACHED

#9 [build 4/6] RUN npm ci
#9 CACHED

#10 [build 5/6] COPY apps/web ./
#10 CACHED

#11 [build 6/6] RUN npm run build
#11 2.106 
#11 2.106 > build
#11 2.106 > next build
#11 2.106 
#11 6.306  ⚠ Invalid next.config.ts options detected: 
#11 6.309  ⚠     Unrecognized key(s) in object: 'trustHostHeader' at "experimental"
#11 6.310  ⚠ See more info here: https://nextjs.org/docs/messages/invalid-next-config
#11 6.355 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#11 6.357 This information is used to shape Next.js' roadmap and prioritize features.
#11 6.357 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#11 6.358 https://nextjs.org/telemetry
#11 6.358 
#11 6.740    ▲ Next.js 15.5.26
#11 6.743    - Experiments (use with caution):
#11 6.744      · serverActions
#11 6.744      ✓ trustHostHeader
#11 6.745 
#11 7.277    Creating an optimized production build ...
#11 106.7 
#11 106.7 
#11 106.7 Retrying 1/3...
#11 106.7 
#11 106.7 
#11 106.7 Retrying 1/3...
#11 110.9 
#11 110.9 
#11 110.9 Retrying 2/3...
#11 114.8 
#11 114.8 
#11 114.8 Retrying 1/3...
#11 114.8 
#11 114.8 
#11 114.8 Retrying 1/3...
#11 114.8 
#11 114.8 
#11 114.8 Retrying 1/3...
#11 145.5  ✓ Compiled successfully in 2.1min
#11 145.5    Linting and checking validity of types ...
#11 190.0 Failed to compile.
#11 190.0 
#11 190.0 ./next.config.ts:10:5
#11 190.0 Type error: Object literal may only specify known properties, and 'trustHostHeader' does not exist in type 'ExperimentalConfig'.
#11 190.0 
#11 190.0 [0m [90m  8 |[39m   allowedDevOrigins[33m:[39m [[32m"127.0.0.1"[39m[33m,[39m [32m"*.trycloudflare.com"[39m][33m,[39m
#11 190.0  [90m  9 |[39m   experimental[33m:[39m {
#11 190.0 [31m[1m>[22m[39m[90m 10 |[39m     trustHostHeader[33m:[39m [36mtrue[39m[33m,[39m
#11 190.0  [90m    |[39m     [31m[1m^[22m[39m
#11 190.0  [90m 11 |[39m     serverActions[33m:[39m {
#11 190.0  [90m 12 |[39m       allowedOrigins[33m:[39m [[32m"108.181.203.225:10049"[39m[33m,[39m [32m"108.181.203.225:10050"[39m[33m,[39m [32m"localhost:3000"[39m[33m,[39m [32m"127.0.0.1:3000"[39m][33m,[39m
#11 190.0  [90m 13 |[39m     }[33m,[39m[0m
#11 190.1 Next.js build worker exited with code: 1 and signal: null
#11 ERROR: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1
------
 > [build 6/6] RUN npm run build:
190.0 Type error: Object literal may only specify known properties, and 'trustHostHeader' does not exist in type 'ExperimentalConfig'.
190.0 
190.0 [0m [90m  8 |[39m   allowedDevOrigins[33m:[39m [[32m"127.0.0.1"[39m[33m,[39m [32m"*.trycloudflare.com"[39m][33m,[39m
190.0  [90m  9 |[39m   experimental[33m:[39m {
190.0 [31m[1m>[22m[39m[90m 10 |[39m     trustHostHeader[33m:[39m [36mtrue[39m[33m,[39m
190.0  [90m    |[39m     [31m[1m^[22m[39m
190.0  [90m 11 |[39m     serverActions[33m:[39m {
190.0  [90m 12 |[39m       allowedOrigins[33m:[39m [[32m"108.181.203.225:10049"[39m[33m,[39m [32m"108.181.203.225:10050"[39m[33m,[39m [32m"localhost:3000"[39m[33m,[39m [32m"127.0.0.1:3000"[39m][33m,[39m
190.0  [90m 13 |[39m     }[33m,[39m[0m
190.1 Next.js build worker exited with code: 1 and signal: null
------
Dockerfile:10

--------------------

   8 |     ENV NEXT_PUBLIC_BASE_PATH=$NEXT_BASE_PATH

   9 |     ENV API_INTERNAL_URL=http://lmc-api:8000

  10 | >>> RUN npm run build

  11 |     

  12 |     FROM node:22-alpine

--------------------

failed to solve: process "/bin/sh -c npm run build" did not complete successfully: exit code: 1

