#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install node dependencies
npm install

# 2. Create bin directory if it doesn't exist
mkdir -p .bin

# 3. Download Linux yt-dlp binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o .bin/yt-dlp

# 4. Make it executable
chmod a+rx .bin/yt-dlp

# 5. Safely append to PATH just for this application runtime environment
export PATH="$PATH:$(pwd)/.bin"