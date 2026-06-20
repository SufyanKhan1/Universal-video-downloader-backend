#!/usr/bin/env bash
# exit on error
set -o errexit

# Install node dependencies
npm install

# Create bin directory if it doesn't exist
mkdir -p .bin

# Download Linux yt-dlp binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o .bin/yt-dlp

# Make it executable
chmod a+rx .bin/yt-dlp