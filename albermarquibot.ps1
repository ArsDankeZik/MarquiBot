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
    }
}
selfUpdate
# Exit 200

$app = Test-Path -Path "app.js" -PathType Leaf
$tts = Test-Path -Path "tts.js" -PathType Leaf
$functions = Test-Path -Path "functions.js" -PathType Leaf
$package = Test-Path -Path "package.json" -PathType Leaf
$instrucciones = Test-Path -Path "Instrucciones.txt" -PathType Leaf
$updates = Test-Path -Path "updates\*" -PathType Leaf
$sounds = Test-Path -Path "sounds\*" -PathType Leaf
$views = Test-Path -Path "views\*" -PathType Leaf
$memes = Test-Path -Path "memes\*" -PathType Leaf
$memesejs = Test-Path -Path "views\memes.ejs" -PathType Leaf

if(-not $app){
    Write-Output "No existe el archivo app.js, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/app.js" -o "app.js"
}

if(-not $app){
    Write-Output "No existe el archivo tts.js, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/tts.js" -o "tts.js"
}

if(-not $functions){
    Write-Output "No existe el archivo functions.js, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/functions.js" -o "functions.js"
}

if(-not $package){
    Write-Output "No existe el archivo package.json, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/package.json" -o "package.json"
}

if(-not $instrucciones){
    Write-Output "No existe el archivo Instrucciones.txt, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/Instrucciones.txt" -o "Instrucciones.txt"
}

if(-not $memesejs){
    Write-Output "No existe el archivo memes.ejs, procediendo a descargarlo desde el servidor"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/views/memes.ejs" -o "views/memes.ejs"
}

if(-not $updates){
    md updates
}

if(-not $sounds){
    md sounds
}

if(-not $memes){
    md memes
}

if(-not $views){
    md views
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/views/_languageData.js" -o "views/_languageData.js"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/views/guessLanguage.js" -o "views/guessLanguage.js"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/views/speech-synthesis.js" -o "views/speech-synthesis.js"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/views/index.ejs" -o "views/index.ejs"
    curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/views/memes.ejs" -o "views/memes.ejs"
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

curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/functions.js" -o "updates/functions.js"
if((Get-FileHash -Path "updates/functions.js" -Algorithm MD5).hash -ne (Get-FileHash -Path "functions.js" -Algorithm MD5).hash){
    Write-Output "Los archivos functions.js son distintos y se procederá a actualizar estos"
    Move-Item -Force -Path "functions.js" -Destination "updates\functions.js.old"
    Move-Item -Force -Path "updates\functions.js" -Destination "functions.js"
}

curl -D "https://raw.githubusercontent.com/ArsDankeZik/MarquiBot/main/tts.js" -o "updates/tts.js"
if((Get-FileHash -Path "updates/tts.js" -Algorithm MD5).hash -ne (Get-FileHash -Path "tts.js" -Algorithm MD5).hash){
    Write-Output "Los archivos tts.js son distintos y se procederá a actualizar estos"
    Move-Item -Force -Path "tts.js" -Destination "updates\tts.js.old"
    Move-Item -Force -Path "updates\tts.js" -Destination "tts.js"
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

npm prune
npm install
npm run start

pause