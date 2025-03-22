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
jsx="$npmBin/jsx src -comment-directives"

if [[ "$pathChanged" == *".tsx" || "$pathChanged" == *".ts" ]]; then
  $jsx
  cp -r public/* src/*.html dist && $tailwind & $esbuild & wait
elif [[ "$pathChanged" == *".html" ]]; then
  cp -r public/* src/*.html dist & $tailwind & wait
else
  mkdir -p dist
  rm -rf dist/*
  $jsx
  cp -r public/* src/*.html dist & $tailwind & $esbuild & wait
fi
