# 色違いサンプルギャラリーをローカルサーバーで開く
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $dir
$port = 8765
$url = "http://localhost:$port/"

Write-Host ""
Write-Host "  色違いサンプル ギャラリー"
Write-Host "  $url"
Write-Host "  終了: Ctrl+C"
Write-Host ""

Start-Process $url

try {
  python -m http.server $port
} catch {
  npx --yes serve -l $port
}
