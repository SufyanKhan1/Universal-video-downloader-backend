#!/usr/bin/env bash
# exit on error
set -o errexit

# 1. Install Node dependencies
npm install

# 2. Update package list and install Python3 (required by yt-dlp)
# Render allows sudo-less apt-get installations for certain runtimes, or we can use portable python if needed. 
# Let's verify if python3 is missing by checking or grabbing a safe binary.

# 3. Create bin directory if it doesn't exist
mkdir -p .bin

# 4. Download Linux yt-dlp binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o .bin/yt-dlp

# 5. Make it executable
chmod a+rx .bin/yt-dlp

# 6. Append to PATH
export PATH="$PATH:$(pwd)/.bin"