# last-deploy-log

run=36262767942 status=success ref=cursor/database-mart-acceso-a5bc at=2026-09-26T18:37:40Z

>> ping ssh 18:30:27
Warning: Permanently added '[108.181.203.225]:10048' (ED25519) to the list of known hosts.
SSH_OK
vps-garga
administrator
Docker version 29.8.1, build 4a63305
/dev/vda3        64G   27G   34G  45% /
               total        used        free      shared  buff/cache   available
Mem:            3916        1204         849          38        1862        2386
>> rsync 18:30:29
>> escribe scripts remotos 18:30:30
env_ok /opt/garga/apps/la-mv-census/deploy/vps/.env
caddy_unchanged
USING:docker compose
>> build api 18:30:37
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
#4 transferring context: 113B 0.0s done
#4 DONE 0.0s

#5 [internal] load build context
#5 DONE 0.0s

#6 [ 1/11] FROM docker.io/library/python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
#6 resolve docker.io/library/python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f 0.1s done
#6 DONE 0.1s

#6 [ 1/11] FROM docker.io/library/python:3.12-slim@sha256:f77ac9e44ae96ef2c90b8053ea08c31f8be030f824196b0ae4db6d462c84e51f
#6 DONE 0.1s

#5 [internal] load build context
#5 transferring context: 3.56MB 0.4s done
#5 DONE 0.5s

#7 [ 3/11] RUN apt-get update && apt-get install -y --no-install-recommends libpq5     && rm -rf /var/lib/apt/lists/*
#7 CACHED

#8 [ 7/11] COPY apps/collector/src/collector /opt/la-mv-census/collector
#8 CACHED

#9 [ 5/11] RUN pip install --no-cache-dir -r requirements.txt
#9 CACHED

#10 [ 6/11] COPY apps/api /opt/la-mv-census
#10 CACHED

#11 [ 8/11] COPY data /opt/la-mv-census/data
#11 CACHED

#12 [ 9/11] COPY scripts/load_anahuac_study.py /opt/la-mv-census/load_anahuac_study.py
#12 CACHED

#13 [10/11] COPY apps/api/entrypoint.sh /entrypoint.sh
#13 CACHED

#14 [ 4/11] COPY apps/api/requirements.txt /opt/la-mv-census/requirements.txt
#14 CACHED

#15 [ 2/11] WORKDIR /opt/la-mv-census
#15 CACHED

#16 [11/11] RUN chmod +x /entrypoint.sh
#16 CACHED

#17 exporting to image
#17 exporting layers 0.0s done
#17 exporting manifest sha256:fe7fe26e324a6e25a15a84a83623010b5b5a58caa03d9792da2579fe6212eb64 done
#17 exporting config sha256:4c7f2b2d03ab042a26e607fcca2b5b61e83c1a11e87fcae4b2cf38240b8f09c3
#17 exporting config sha256:4c7f2b2d03ab042a26e607fcca2b5b61e83c1a11e87fcae4b2cf38240b8f09c3 done
#17 exporting attestation manifest sha256:d69b3c6adc77dca72057fb15390fdcff98311a84e8dfac8c27c307feef1df754 0.1s done
#17 exporting manifest list sha256:d18903ea3d7b0e8c144ba0cb5d00adb6593407efe045e7ef3f8a1c5624dff546
#17 exporting manifest list sha256:d18903ea3d7b0e8c144ba0cb5d00adb6593407efe045e7ef3f8a1c5624dff546 0.1s done
#17 naming to docker.io/library/lmc-api:latest done
#17 unpacking to docker.io/library/lmc-api:latest 0.1s done
#17 DONE 0.6s

#18 resolving provenance for metadata file
#18 DONE 0.0s
 Image lmc-api Built 
>> build web 18:30:41
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
#6 resolve docker.io/library/node:22-alpine@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402 0.1s done
#6 DONE 0.2s

#5 [internal] load build context
#5 transferring context: 255.99kB 0.1s done
#5 DONE 0.1s

#7 [build 2/6] WORKDIR /app
#7 CACHED

#8 [build 3/6] COPY apps/web/package.json apps/web/package-lock.json ./
#8 CACHED

#9 [build 4/6] RUN npm ci
#9 CACHED

#10 [build 5/6] COPY apps/web ./
#10 DONE 0.2s

#11 [build 6/6] RUN npm run build
#11 1.676 
#11 1.676 > build
#11 1.676 > next build
#11 1.676 
#11 5.465 Attention: Next.js now collects completely anonymous telemetry regarding usage.
#11 5.468 This information is used to shape Next.js' roadmap and prioritize features.
#11 5.470 You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
#11 5.470 https://nextjs.org/telemetry
#11 5.471 
#11 5.838    ▲ Next.js 15.5.26
#11 5.838    - Experiments (use with caution):
#11 5.840      · serverActions
#11 5.840 
#11 6.172    Creating an optimized production build ...
#11 110.7 
#11 110.7 
#11 110.7 Retrying 1/3...
#11 110.8 
#11 110.8 
#11 110.8 Retrying 1/3...
#11 120.5 
#11 120.5 
#11 120.5 Retrying 1/3...
#11 155.6  ✓ Compiled successfully in 2.3min
#11 155.6    Linting and checking validity of types ...
#11 201.9    Collecting page data ...
#11 218.6    Generating static pages (0/10) ...
#11 224.8    Generating static pages (2/10) 
#11 224.8    Generating static pages (4/10) 
#11 224.8    Generating static pages (7/10) 
#11 225.8  ✓ Generating static pages (10/10)
#11 233.6    Finalizing page optimization ...
#11 233.6    Collecting build traces ...
#11 334.1 
#11 334.1 Route (app)                                 Size  First Load JS
#11 334.1 ┌ ○ /                                      141 B         103 kB
#11 334.1 ├ ○ /_not-found                            991 B         104 kB
#11 334.1 ├ ƒ /api/login                             141 B         103 kB
#11 334.1 ├ ƒ /equipo                              1.13 kB         114 kB
#11 334.1 ├ ƒ /estudios                            1.52 kB         215 kB
#11 334.1 ├ ƒ /estudios/[id]                       8.85 kB         238 kB
#11 334.1 ├ ƒ /estudios/[id]/alertas                 141 B         103 kB
#11 334.1 ├ ƒ /estudios/[id]/archivo/[formato]       141 B         103 kB
#11 334.1 ├ ƒ /estudios/[id]/carga                 2.35 kB         112 kB
#11 334.1 ├ ƒ /estudios/[id]/comparar              6.41 kB         226 kB
#11 334.1 ├ ƒ /estudios/[id]/fuentes                 141 B         103 kB
#11 334.1 ├ ƒ /estudios/[id]/menciones               162 B         106 kB
#11 334.1 ├ ƒ /estudios/[id]/objetivos               141 B         103 kB
#11 334.1 ├ ƒ /estudios/[id]/preguntar              4.1 kB         114 kB
#11 334.1 ├ ƒ /estudios/[id]/reporte                1.3 kB         111 kB
#11 334.1 ├ ƒ /estudios/nuevo                      1.13 kB         114 kB
#11 334.1 ├ ○ /icon.svg                                0 B            0 B
#11 334.1 └ ○ /login                               2.57 kB         112 kB
#11 334.1 + First Load JS shared by all             103 kB
#11 334.1   ├ chunks/255-4bc6b14bc2620134.js       46.4 kB
#11 334.1   ├ chunks/4bd1b696-c023c6e3521b1417.js  54.2 kB
#11 334.1   └ other shared chunks (total)          1.93 kB
#11 334.1 
#11 334.1 
#11 334.1 ƒ Middleware                             34.2 kB
#11 334.1 
#11 334.1 ○  (Static)   prerendered as static content
#11 334.1 ƒ  (Dynamic)  server-rendered on demand
#11 334.1 
#11 DONE 334.9s

#7 [build 2/6] WORKDIR /app
#7 CACHED

#12 [stage-1 3/4] COPY --from=build /app/.next/standalone ./
#12 DONE 1.6s

#13 [stage-1 4/4] COPY --from=build /app/.next/static ./.next/static
#13 DONE 0.2s

#14 exporting to image
#14 exporting layers
#14 exporting layers 11.4s done
#14 exporting manifest sha256:676ee8170a5bfc3814ac3b41ec5547eed9ef2d7eeaccd265978cecf032e0408d 0.0s done
#14 exporting config sha256:ee8dea2813471ad9ed792cd034ba58506a1b0c0e111e58a50e8077b08b1d5d49 0.0s done
#14 exporting attestation manifest sha256:6f302a8661d620a0ad19fe2a137de0a562f6d8330ca986ff5dad5dc3b4999dd2
#14 exporting attestation manifest sha256:6f302a8661d620a0ad19fe2a137de0a562f6d8330ca986ff5dad5dc3b4999dd2 0.0s done
#14 exporting manifest list sha256:2ab09dd089eaca41821c8e29c3d092c5b1e19ecb6306be87036f67e3156a859a 0.0s done
#14 naming to docker.io/library/lmc-web:latest done
#14 unpacking to docker.io/library/lmc-web:latest
#14 unpacking to docker.io/library/lmc-web:latest 4.5s done
#14 DONE 16.2s

#15 resolving provenance for metadata file
#15 DONE 0.1s
 Image lmc-web Built 
>> up 18:36:39
 Container lmc-api Recreate 
 Container lmc-api Recreated 
 Container lmc-web Recreate 
 Container lmc-web Recreated 
 Container lmc-api Starting 
 Container lmc-api Started 
 Container lmc-web Starting 
 Container lmc-web Started 
>> wait api 18:36:46
web_ready_2
>> caddy reload 18:36:55
caddy_reload_ok
NAME      IMAGE     COMMAND                  SERVICE   CREATED          STATUS          PORTS
lmc-api   lmc-api   "/entrypoint.sh"         api       17 seconds ago   Up 11 seconds   8000/tcp
lmc-web   lmc-web   "docker-entrypoint.s…"   web       14 seconds ago   Up 11 seconds   0.0.0.0:3092->3000/tcp, [::]:3092->3000/tcp
>> smoke local 18:36:57
login:200
ok_title True
bytes 26940
LISTO http://108.181.203.225:10049/census/login
