# GoWood Poc

Proof of concept for the GoWood raw material tracking.

# Getting started

Currently, you can start app using node dev server for frontend and Leininger dev server.

NOTE: Support for docker-compose is on roadmap but not yet implemented. Currently it's a bit clumsy to setup everything.

## Prerequisites

- Install Node Js (see https://nodejs.org/en/)

Frontend Application should work with Node 8.11.0 or later, and npm 6.4.1 or later. It may work on earlier versions.

- Install Leininger (see https://leiningen.org/)

Backend application (query-service) require Java (OpenJDK 8 is recommend) and is written with Clojure.

- Pull git this repository. 

## Starting services

Start following services in separate console shells:

1. Start JanusGraph database using docker-compose
2. Start query-service (Backend)
3. Start frontend
4. Initialize POC data to database

You can start services at the same time. Start with query-service, because starting it will take more time. 

## 1. Start JanusGraph database

You can use the JanusGraph container in `database/janusgraph-docker-compose.yml` 

It is originally from 
https://github.com/janusgraph/janusgraph-docker#janusgraph-docker-images

### Launch the container

In root folder: 

`docker-compose -f database/janusgraph-docker-compose.yml up`

### Stop the running container
ctrl-C

### Stop AND REMOVE/DELETE the container
`docker-compose -f janusgraph-docker-compose.yml down`

### Resume a stopped container
Check the id with `docker ps -a`

Start stopped container:
`docker start -a janusgraph-default`

## 2. Starting local server in console

1. In git repository, go to `query-service` folder:

```
cd frontend
```

2. Start dev service

```
lein run
```

If you have not started service before, it will take for a while as Leininger fetches all dependencies (including Clojure 1.10.0 itself). If there are no new dependencies to get, it should less than a minute.

*Notes:*

* Query service will run in port 3000 (http://localhost:3000) 
* Query service root will redirect to OpenAPI/Swagger docs
* CORS won't work in query-backend and hench http://localhost:3000 is not queried directly. Frontend service will work as a reverse proxy and redirect request to /api/* to query-backend.

## 3. Starting local server in console

1. In git repository, go to `frondend` folder:

```
cd frontend
```

2. Install dependencies in `frontend` folder. 

```
npm install
```

Note: You need to do this always when there are new dependencies. If you are not sure it this step is needed, do it always. If there are no new dependencies to install it should not take long. If you know, that there are no new deps, skip this step.

3. Start dev server

```
npm start
```

Note: Staring demo server takes tens of seconds. There is also a warning when starting a server (about browser list). You can ignore this error. Demo server will start in port 8080. If you have something else running there, initialization will fail.

4. Go to address: `http://localhost:8080/`

## 4. Initialize POC data to database

Initialize database just once! 

You can do it using curl as follow
```
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/octet-stream' 'http://localhost:3000/api/db/janus-graph'
```

You can use also swagger UI:

http://localhost:3000/api/api-docs/index.html#!/POC32admin/post_api_db_janus_graph

# Developing app

## Structure

- /frontend
  - Contains frontend client & frontend node backend
  - Stack: TypeScript, Cycle.js, Mapboxgl, Three.js 
  - See /frontend/readme.md for further details

- /query-service 
  - Contains backend for data queries
  - Stack: Clojure, Reitit
  - See /query-service/readme.md for further details

## Backlog

https://www.pivotaltracker.com/n/projects/2408940
