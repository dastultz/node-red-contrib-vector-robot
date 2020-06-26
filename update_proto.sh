#!/bin/bash

# A script to pull and update official SDK assets

# TODO this isn't quite done yet, it's meant to pull or update a local copy of the official
# SDK and copy some files into this project

DEST_DIR=lib/protobufs/anki_vector/messaging
mkdir -p ${DEST_DIR}
rm -f ${DEST_DIR}/*.proto

# todo: does source directory already exist?
# then git fetch/pull
# else
# git clone https://github.com/anki/vector-python-sdk.git
cd vector-python-sdk
git pull
cd ../
cp vector-python-sdk/anki_vector/messaging/*.proto ${DEST_DIR}

