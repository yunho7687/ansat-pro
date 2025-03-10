# Build docker image with volume
docker build -f ./frontend/Dockerfile -t nasat .

# Run docker container with volume
docker run -it -p 19000:19000 -v "${PWD}\frontend:/app" nasat
