@echo off
cd server
start cmd /k node index.js
cd ..
start cmd /k python -m http.server 8000