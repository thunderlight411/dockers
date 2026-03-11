#!/bin/bash

CONTAINER=$1

if [ -z "$CONTAINER" ]; then
  echo "Usage:"
  echo "./build-local.sh <container>"
  exit 1
fi

echo "Building container: $CONTAINER"

docker build \
-t local/$CONTAINER \
./containers/$CONTAINER
