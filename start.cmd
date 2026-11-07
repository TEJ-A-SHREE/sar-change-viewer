@echo off
rem Windows launcher: runs start.sh inside WSL. Double-click or run from cmd.
wsl.exe bash -lc "cd \"$(wslpath '%~dp0')\" && ./start.sh"
