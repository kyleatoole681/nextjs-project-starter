#!/bin/bash

# Create a zip file of the extension
zip -r aviator-predictor.zip \
    manifest.json \
    contentScript.js \
    popup.html \
    popup.css \
    popup.js \
    background.js \
    icons/ \
    README.md

echo "Extension has been packaged into aviator-predictor.zip"
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable Developer mode (top right)"
echo "3. Drag and drop aviator-predictor.zip into the Chrome window"
