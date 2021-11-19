Function selfUpdate {
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/albermarquibot.ps1" -o "updates/self_update.ps1"
    $ps_origin = (Get-FileHash -Path "albermarquibot.ps1" -Algorithm MD5).hash
    $ps_remote = (Get-FileHash -Path "updates\self_update.ps1" -Algorithm MD5).hash
    $compps = $ps_origin -ne $ps_remote

    if($compps){
        Write-Output "Actualizando el propio script"
        Move-Item -Force -Path "albermarquibot.ps1" -Destination "updates\albermarquibot.ps1.old"
        Move-Item -Force -Path "updates\self_update.ps1" -Destination "albermarquibot.ps1"
        powershell.exe -Command "& '.\albermarquibot.ps1'"
        Start-Sleep -Seconds 4
        Exit 200 #Custom code, doesnt matter what you put here
    } 
    else {
        Write-Output "Este script está en la última versión"
        start powershell{ cd ..\chrome-speech-synthesis\; .\start.ps1; PAUSE;}
    }
}
selfUpdate
# Exit 200

$app = Test-Path -Path "app.js" -PathType Leaf
$package = Test-Path -Path "package.json" -PathType Leaf
$instrucciones = Test-Path -Path "Instrucciones.txt" -PathType Leaf
$env = Test-Path -Path ".env" -PathType Leaf
$updates = Test-Path -Path "updates\*" -PathType Leaf
$sounds = Test-Path -Path "sounds\*" -PathType Leaf

if(-not $app){
    Write-Output "No existe el archivo app.js, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/app.js" -o "app.js"
}

if(-not $package){
    Write-Output "No existe el archivo package.json, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/package.json" -o "package.json"
}

if(-not $instrucciones){
    Write-Output "No existe el archivo Instrucciones.txt, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/Instrucciones.txt" -o "Instrucciones.txt"
}

if(-not $env){
    $tname = "TWITCH_USERNAME=albermarquibot" 
    $oauth = "TWITCH_OAUTH=cowt3m9o5av7k7z23ht3tujaoriyei"
    $channel = "TWITCH_CHANNEL=albermarqui"

    $PSDefaultParameterValues['*:Encoding'] = 'utf8'
    $tname | Out-File -FilePath '.env' 
    Add-Content -Path '.env' -Value $oauth
    Add-Content -Path '.env' -Value $channel
}

if(-not $updates){
    md updates
}

if(-not $sounds){
    md sounds
}

cls

curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/app.js" -o "updates/app_update.js"
$hash_app = (Get-FileHash -Path "app.js" -Algorithm MD5).hash
$hash_app2 = (Get-FileHash -Path "updates\app_update.js" -Algorithm MD5).hash
$comp1 = $hash_app -ne $hash_app2

if($comp1){
    Write-Output "Los archivos app.js son distintos y se procederá a actualizar estos"
    Move-Item -Force -Path "app.js" -Destination "updates\app.js.old"
    Move-Item -Force -Path "updates\app_update.js" -Destination "app.js"
}

curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/package.json" -o "updates/package_update.json"
$hash_json1 = (Get-FileHash -Path "package.json" -Algorithm MD5).hash
$hash_json2 = (Get-FileHash -Path "updates\package_update.json" -Algorithm MD5).hash
$comp2 = $hash_json1 -ne $hash_json2

if($comp2){
    Write-Output "Los archivos package.json son distintos y se procederá a actualizar estos"
    Move-Item -Force -Path "package.json" -Destination "updates\package.json.old"
    Move-Item -Force -Path "updates\package_update.json" -Destination "package.json"
}

# Remove this two commands after update them
Remove-Item -Path "piropos.js"
Remove-Item -Path "insultos.js" 

$piropos = Test-Path -Path "piropos.js" -PathType Leaf
$insultos = Test-Path -Path "insultos.js" -PathType Leaf

if(-not $piropos){
    Write-Output "No existe el archivo piropos.js, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/piropos.js" -o "piropos.js"
}

if(-not $insultos){
    Write-Output "No existe el archivo insultos.js, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/insultos.js" -o "insultos.js"
}

# Remove-Item -LiteralPath "node_modules/" -Force -Recurse 
npm prune
npm install
npm run start
# $pruneID = powershell.exe -Command "(Start-Process -FilePath npm -ArgumentList prune -PassThru -WindowStyle Hidden).Id"
# $installID = powershell.exe -Command "(Start-Process -FilePath npm -ArgumentList install -PassThru -WindowStyle Hidden).Id"
# $startID = powershell.exe -Command "(Start-Process -FilePath npm -ArgumentList install -PassThru -WindowStyle Hidden).Id"

pause