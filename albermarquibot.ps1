curl -D "https://raw.githubusercontent.com/ArsDankeZik/acestreamLinks/main/app.js" -o "updates/app_update.js"
$hash_app = (Get-FileHash -Path "app.js" -Algorithm MD5).hash
$hash_app2 = (Get-FileHash -Path "updates\app_update.js" -Algorithm MD5).hash
$comp1 = $hash_app -ne $hash_app2

if($comp1){
    Write-Output "Los archivos son distintos y se procederá a actualizar estos"
    Move-Item -Force -Path "app.js" -Destination "updates\app.js.old"
    Move-Item -Force -Path "updates\app_update.js" -Destination "app.js"
}

curl -D "https://raw.githubusercontent.com/ArsDankeZik/acestreamLinks/main/package.json" -o "updates/package_update.json"
$hash_json1 = (Get-FileHash -Path "package.json" -Algorithm MD5).hash
$hash_json2 = (Get-FileHash -Path "updates\package_update.json" -Algorithm MD5).hash
$comp2 = $hash_json1 -ne $hash_json2

if($comp2){
    Write-Output "Los archivos son distintos y se procederá a actualizar estos"
    Move-Item -Force -Path "package.json" -Destination "updates\package.json.old"
    Move-Item -Force -Path "updates\package_update.json" -Destination "package.json"
}

# Remove-Item -LiteralPath "node_modules/" -Force -Recurse 
npm install
npm run start

pause