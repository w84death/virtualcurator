#!/bin/bash
for i in *.jpg; do if [ ! -f "${i%.*}_thumb.jpg" ]; then ffmpeg -i "$i" -vf scale=240:-1 "${i%.*}_thumb.jpg"; fi; done

