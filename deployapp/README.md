To build the docker :
%> rm -rf ./dist
%> cp -r ../dist ./

%> docker buildx create --use
%> docker buildx build --platform linux/arm64,linux/arm/v7,linux/arm/v5,linux/amd64,linux/386,linux/arm/v8 -t horfee/quicknote:1.0 -t horfee/quicknote:latest . --push
