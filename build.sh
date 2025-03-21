#!/bin/bash

npmBin="./node_modules/.bin"
flags="--sourcemap --bundle --outdir=dist --outbase=build --alias:~=./build"
if [[ "$1" = "release" ]]; then
  flags="$flags --drop-labels=DEV --minify"
  pathChanged=""
else
  pathChanged=$(cat)
fi

tailwind="$npmBin/tailwindcss -i src/styles.css -o dist/styles.css"
esbuild="$npmBin/esbuild build/main.tsx $flags"

if [[ "$pathChanged" == *".tsx" || "$pathChanged" == *".ts" ]]; then
  $npmBin/jsx src
  cp -r public/* src/*.html dist && $tailwind & $esbuild & wait
elif [[ "$pathChanged" == *".html" ]]; then
  cp -r public/* src/*.html dist & $tailwind & wait
else
  mkdir -p dist
  rm -rf dist/*
  $npmBin/jsx src
  cp -r public/* src/*.html src/*.vert src/*frag dist & $tailwind & $esbuild & wait
fi
