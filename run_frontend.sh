#!/bin/bash

# Build docker image with volume
docker build -f ./frontend/Dockerfile -t nasat .

# Run docker container with volume
docker run -it -p 19001:19001 -v "$(pwd)/frontend:/app" nasat
