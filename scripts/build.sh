#!/usr/bin/env bash

set -eu

dir=$1

cd "$dir"
npm i
npm run build
