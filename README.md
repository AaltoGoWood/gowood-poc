# GoWood Poc

Proof of concept for the GoWood raw material tracking.

# Getting started

Currently, you can start app using node dev server. 

## Prerequisites

- Install Node Js (see https://nodejs.org/en/)

Application should work with Node 8.11.0 or later, and npm 6.4.1 or later. It may work on earlier versions.

- Pull git this repository. 

## Starting local server in console

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

# Developing app

## Structure

- /frontend
  - Contains frontend client & frontend node backend
  - Stack: Cycle.js
  - See /frontend/readme.md for further details

## Backlog

https://www.pivotaltracker.com/n/projects/2408940
