#!/bin/bash

CONTAINER=$1

if [ -z "$CONTAINER" ]; then
  echo "Usage: build-local.sh <container>"
  exit 1
fi

docker build -t local/$CONTAINER ./containers/$CONTAINER
