#!/bin/bash

# Build docker image with volume
docker build -f ./docker/frontend/Dockerfile -t frontend .

# Run docker container with volume
docker run -it -p 19000:19000 -v "$(pwd)/frontend:/app" frontend
