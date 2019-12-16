# GoWood Poc

Proof of concept for the GoWood raw material tracking.

# Getting started

You can start each of the application services separately or all at once using docker-compose.
Instructions for both below. 
Notice that you can also start some the services with docker-compose and some 
manually on the terminal. For this you need to momentarily disable (comment out)
those services from docker-compose.yml that you wish to start manually OR
start everything with docker-compose and then manually stop the ones you are planning to start
on the terminal yourself.

## Prerequisites

### For running the application for demo purposes

Docker should be the only dependency for running the app

Installation details for Docker depend on the operating system you are using

Linux distros: https://docs.docker.com/install/ (choose the one you have)
Windows 10: https://docs.docker.com/docker-for-windows/install/
MAC: https://docs.docker.com/docker-for-mac/install/

### For development purposes

- Install docker (see previous section)

- Install Node Js (see https://nodejs.org/en/)

Frontend Application should work with Node 8.11.0 or later, and npm 6.4.1 or later. It may work on earlier versions.

- Install Leiningen (see https://leiningen.org/)

Backend application (query-service) require Java (OpenJDK 8 is recommend) and is written with Clojure.

Clone this git repository:

```git clone git@github.com:AaltoGoWood/gowood-poc.git```

# Start and run all services with one commmand using docker-compose

1. build and start services with docker-compose
2. initialize POC data to the database


## 1. build and start services with docker-compose

In Mac, Linux and in WSL (Windows Subsystem for Linux), run in root folder:

```
docker-compose up
```

In Windows when not using WSL, run following command in root folder in Windows PowerShell prompt:

```
$ENV:PWD = (("$(pwd)" -replace "\\","/") -replace "c:","/c"); docker-compose up
```

This will take several minutes.
At first run probably up to 30 minutes or so

NOTE: Currently Holochain instance runs in-memory instance. If you want to persist instance source chain into file change in-memory-instance-conductor-config.toml config file to file-instance-conductor-config.toml in docker-compose.yaml.

## 2. initialize POC data to the database

see section `5. Initialize POC data to the database` 



# Starting services for development purposes (optional)

Start following services in separate console shells:

1. Start JanusGraph database using docker-compose
2. Start local query-service server (backend)
3. Start local frontend service
4. Start holochain app 
5. Initialize POC data to the database

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

## 2. Start local query-service server (backend)

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

## 3. Start local frontend service

1. In git repository, go to `frontend` folder:

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
OR

```
npm run start-dev
```



Note: Starting demo server takes tens of seconds. There is also a warning when starting a server (about browser list). You can ignore this error. Demo server will start in port 8080. If you have something else running there, initialization will fail.

4. Go to address: `http://localhost:8080/`

## 4. Start holochain app


### 1) Build image

In `/holochain` folder

```
docker build -t holochain-image .
```
### 2) run it and bind app folder to it

```
docker run -it -p 8888:8888 --name holochain-container --mount src="$(pwd)"/app,target=/holochain,type=bind holochain-image bash
```

More info in /holochain/readme.md


## 5. Initialize POC data to the database

Initialize database just once! 

You can do it using curl as follow
```
curl -X POST --header 'Content-Type: application/json' --header 'Accept: application/octet-stream' 'http://localhost:3000/api/db/janus-graph'
```
You can use also swagger UI:

http://localhost:3000/api/api-docs/index.html#!/POC32admin/post_api_db_janus_graph

Click the button "Try it out" in the green box under the heading: POST /api/db/janusgraph


# Developing the app

## Structure

- /frontend
  - Contains frontend client & frontend node backend
  - Stack: TypeScript, Cycle.js, Mapboxgl, Three.js 
  - See /frontend/readme.md for further details

- /query-service 
  - Contains backend for data queries
  - Stack: Clojure, Reitit
  - See /query-service/readme.md for further details

- /database
  - Contains only the docker compose file for easily running the backend container
  - Stack: JanusGraph

- /holochain
  - Contains the holochain app written in rust
  - Stack: Holochain, rust

## Backlog

https://www.pivotaltracker.com/n/projects/2408940

# Acknowledgement

Used tree trunk data from a Harvester data sample provided by Arbonaut Oy and used with their permission. Building shown in map including Geojson model is OpenData provided by Helsinki City. Used 3D model is used with Creative Commons licence (CC BY 4.0). Model is created by lowlypoly (https://sketchfab.com/3d-models/building-apartment-2-305a61a885b24540af1c408b78a01b45).

