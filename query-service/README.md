# Query-service

generated using Luminus version "3.53"

## Start the JanusGraph 

You can use the janusgrap container in `database/janusgraph-docker-compose.yml` 

It is originally from 
https://github.com/janusgraph/janusgraph-docker#janusgraph-docker-images

### Launch the container
`docker-compose -f janusgraph-docker-compose.yml up`

### Stop the running container
ctrl-C

### Stop AND REMOVE/DELETE the container
`docker-compose -f janusgraph-docker-compose.yml up`

### Resume a stopped container
Check the id with `docker ps -a`
`docker start <id>`

## Prerequisites

You will need [Leiningen][1] 2.0 or above installed.

[1]: https://github.com/technomancy/leiningen

## Running

To start a web server for the application, run:

```
lein run 
```