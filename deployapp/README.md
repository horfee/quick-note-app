To build the docker :
%> rm -rf ./dist
%> cp -r ../dist ./

%> docker context use colima-profile_x86_64
%> docker run --privileged --rm docker binfmt:a7996909642ee92942dcd6cff44b9b95f08dad64
%> docker buildx create --use
%> docker buildx build --platform linux/arm64,linux/arm/v7,linux/arm/v5,linux/amd64,linux/386,linux/arm/v8 -t horfee/quicknote:1.2 -t horfee/quicknote:latest . --push
