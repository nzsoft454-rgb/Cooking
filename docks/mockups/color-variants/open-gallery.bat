@echo off
cd /d "%~dp0"
echo.
echo  色違いサンプル ギャラリーを起動します...
echo  ブラウザ: http://localhost:8765/
echo  終了: この窓で Ctrl+C
echo.
start "" "http://localhost:8765/"
python -m http.server 8765 2>nul
if errorlevel 1 (
  echo Python が見つかりません。Node で起動します...
  npx --yes serve -l 8765
)
