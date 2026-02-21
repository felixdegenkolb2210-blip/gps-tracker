$exe = Join-Path $PSScriptRoot 'dist\start-gps.exe'
if (-Not (Test-Path $exe)) { Write-Error "Exe not found: $exe"; exit 1 }
Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe)
Start-Sleep -Seconds 1
Start-Process "http://127.0.0.1:5000"
