@echo off
echo Starting install...
call npm install rss-parser @google/generative-ai --legacy-peer-deps > npm_log.txt 2>&1
echo Done install.
