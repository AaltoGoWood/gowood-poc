

# Preparation

## 1) Build image

In `/holochain` folder

```
docker build -t holo-test .
```
## 2) run it and bind app folder to it

```
docker run -it -p 8888:8888 --name holo-test-1 --mount src="$(pwd)"/app,target=/holochain,type=bind holo-test bash
```

# Returning to a stopped container

```
docker start holo-test
```

# Holochain development flow

After you have started container, load Holochain env-variables and start nix-shell:

```
. /home/docker/.nix-profile/etc/profile.d/nix.sh
nix-shell https://holochain.love
```

## Compile package in shell

```
hc package
```

When you first time run this command it takes minutes. Later, once initial dependencies are downloaded and compiled, this command becomes faster to run.

## Start package

```
hc run -i http
```

## Test outside container

```
curl -X POST -H "Content-Type: application/json" -d '{"id": "0", "jsonrpc": "2.0", "method": "call", "params": {"instance_id": "test-instance", "zome": "hello", "function": "create_my_entry", "args": {"entry": {"content": "foobar"}} }}' http://127.0.0.1:8888
```

The system returns something like this: `{"jsonrpc":"2.0","result":"{\"Ok\":\"Qmb3rt6jfXG4TbDP5H6a2VhCVbqRbVr5op4ZTHdxYqMtnR\"}","id":"0"}`

Copy address from the result and try to get value related to it.

```
curl -X POST -H "Content-Type: application/json" -d '{"id": "0", "jsonrpc": "2.0", "method": "call", "params": {"instance_id": "test-instance", "zome": "hello", "function": "get_my_entry", "args": {"address": "QmQ7R6oHJbrZbmNTjACjLoFJC6F7AMxDgidLLGzwnC61gU" }}}' http://127.0.0.1:8888
```


# Mics

## Delete container and image to build it again

```
docker rm holo-test-1 
docker rmi holo-test
```
