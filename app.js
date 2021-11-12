require('dotenv').config();
const tmi = require('tmi.js');
const iconv = require('iconv-lite');
const proc = require('child_process');
const ct = require('countries-and-timezones');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const request = require('request');
const sound = require('sound-play');
const gtts = require('node-gtts')('es');
const piropos = require('./piropos').piropos;
const insultos = require('./insultos').insultos;

// Variables para el programa
const SUBS = true; // CONSTANTE GLOBAL PARA HABILITAR CIERTOS COMANDOS SOLO PARA SUBS/VIPS/MODS
const VOL = 0.60; // Controla el volumen de los sonidos !sonido
const VERSION = '1.2.8';
var filepath = path.join(__dirname, 'prueba.wav');
var magicNumber = getRandInt(1, 50);
var previousNumber = -1;
OBJECT_PEOPLE_LIFES = {};
EXCEPT_FROM_PERMISSION_LIST = [];
var PREFER_TTS = true; // On true google on false talktome

console.log(`El número a adivinar es: ${magicNumber}`);

// LINK PARA HACER IMPLEMENTAR CANJEAR POR PUNTOS https://www.twitch.tv/videos/806178796?collection=E1yJPFFiSBZBrQ
// Audio https://www.npmjs.com/package/speaker
// Audio buffer https://www.npmjs.com/package/audio-buffer

const client = new tmi.Client({
    options: { debug: true, messagesLogLevel: 'info'},
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: `${process.env.TWITCH_USERNAME}`,
        password: `oauth:${process.env.TWITCH_OAUTH}`
    },
    channels: [`${process.env.TWITCH_CHANNEL}`]
});

function googleTalkToMe(text){
    gtts.save(filepath, text, () => {
        sound.play(path.join(__dirname, "prueba.wav"), VOL); 
    });
}

function cleanCommandListener(arr){
    [channel, tags, message, cmd, permission, permissionExceptions] = arr;
    if(permission) {
        if(!onlySubsAllowed(tags) || permissionExceptions.includes(tags.username)){
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
            return false;
        }
    }
    msg = message.replace(cmd, '').toLowerCase().trim();    
    if(msg.length == 0) return true;
    if(msg.length > 0) return msg;

    console.error('ERROR: Not expected to get at final of cleanCommandListener');
    return false;
}

client.connect().catch(console.error);

client.on('message', (channel, tags, message, self) => {
    if(self) return;
    if(tags.username.toLowerCase() === 'streamelements') return;
    //Normalize cmd and check if include cmd
    const msgIncludesCMD = (cmd, message) => message.toLocaleLowerCase().includes(cmd) ? true : false;
    //Normalize cmd and check if cmd and message match
    const msgIsCMD = (cmd, message) => message.toLowerCase().split(' ')[0] == cmd ? true : false;

    //Restrict perms on user doesn't matter if have vip, sub, mod
    const excludeFromPermissions = (user) => EXCEPT_FROM_PERMISSION_LIST.push(user);
    const deleteFromExcludeFromPermissions = (user) => EXCEPT_FROM_PERMISSION_LIST = EXCEPT_FROM_PERMISSION_LIST.filter(r => r != user); 

    if(msgIsCMD('!delete', message)){
        if(isModWhoCalls(tags)){
            console.log(tags);
            client.deletemessage(channel, tags.id);
        }
    }

    if(msgIncludesCMD('!deftts', message)){
        if(isModWhoCalls(tags)){
            const params = [channel, tags, message, '!deftts', true, []];
            const ttsMode = cleanCommandListener(params);
            if(ttsMode && ttsMode == '-m') PREFER_TTS = false;
            else if(ttsMode && ttsMode == '-l') PREFER_TTS = true;
        }
    }

    if(msgIncludesCMD('!excluir', message)){
        if(isModWhoCalls(tags)){
            const params = [channel, tags, message, '!excluir', true, []];
            const username = cleanCommandListener(params);
            if(username) excludeFromPermissions(username);
            else console.error(channel, 'Unexpected error');
        }
    }

    if(msgIncludesCMD('!incluir', message)){
        if(isModWhoCalls(tags)){
            const params = [channel, tags, message, '!incluir', true, []];
            const username = cleanCommandListener(params);
            if(username) deleteFromExcludeFromPermissions(username);
            else console.error(channel, 'Unexpected error');
        }
    }

    if(msgIncludesCMD('!ttsinsulto', message)){
        const params = [channel, tags, message, '!ttsinsulto', true, EXCEPT_FROM_PERMISSION_LIST];
        const value = cleanCommandListener(params);

        if(PREFER_TTS && value){
            googleTalkToMe(`${tags.username} dice ${pickRandom(insultos)}`);
        }
        else if(!PREFER_TTS && value) {
            talkToMe(`${tags.username} dice ${pickRandom(insultos)}`);
        }
        else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if(msgIncludesCMD('!ttspiropo', message)){
        const params = [channel, tags, message, '!ttspiropo', true, EXCEPT_FROM_PERMISSION_LIST];
        const value = cleanCommandListener(params);

        if(PREFER_TTS && value){
            googleTalkToMe(`${tags.username} dice ${pickRandom(piropos)}`);
        }
        else if(!PREFER_TTS && value) {
            talkToMe(`${tags.username} dice ${pickRandom(piropos)}`);
        }
        else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if(msgIsCMD('!tts', message)){
        const params = [channel, tags, message, '!tts', true, EXCEPT_FROM_PERMISSION_LIST];
        const value = cleanCommandListener(params);

        if(PREFER_TTS) {
            googleTalkToMe(`${tags.username} dice ${value}`);
        }
        else if(!PREFER_TTS){
            talkToMe(`${tags.username} dice ${value}`);
        }
        else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if(message.toLocaleLowerCase().includes('!sonido')){
        msg = message.replace('!sonido', '').trim();
        onlySubsAllowed(tags) ? 
            playSound(`${msg}`) : 
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
    }

    if(message.toLocaleLowerCase().includes('!hora')){
        msg = message.replace('!hora', '').trim();
        console.log(msg);
        client.say(channel, `${calculateHour(msg.toUpperCase())}`);
    }

    if(message.toLocaleLowerCase().includes('!adivinaelnr')){
        msg = message.replace('!adivinaelnr', '').trim();
        client.say(channel, `${takeAGuess(msg, tags.username)}`);
    }

    if(message.toLowerCase().includes('!rvidas')){
        msg = message.replace('!rvidas', '').trim();
        if(tags.badges != null && tags.badges != undefined && (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem')){
            console.log(msg);
            if(!msg || msg.length == 0) client.say(channel, `El comando es !rvidas usuario`);
            else client.say(channel, `${registerUserAndCount(msg, 'reset')}`);
        }
    }

    if(message.toLowerCase().includes('!help')){
        msg = message.replace('!help', '').trim();
        msg = msg.replace('!', '');
        menu = msg.length == 0;
        
        const checkLVL = (tags) => {
            if(tags.badges != null && tags.badges != undefined){
                if(tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem') return 2;
                if(tags.badges.hasOwnProperty('vip') || tags.badges.hasOwnProperty('moderator') || tags.badges.hasOwnProperty('founder') || tags.badges.hasOwnProperty('premium')) return 1;
            }
            return 0;
        };

        if(menu) client.say(channel, `Escribe !help comando(sustituye comando por el comando que quieras consultar, no me seas borrego) para saber más acerca de un comando. Comandos disponibles: ${helpMenu(checkLVL(tags), true, null)}`);
        if(!menu) client.say(channel, `${helpMenu(checkLVL(tags), false, msg)}`); 
    }
    
    switch(message.toLowerCase()){
        case '!insulto': 
            client.say(channel, `${pickRandom(insultos)}`);
            break;
        case '!log':
            if(tags.badges.hasOwnProperty('moderator') || tags.badges.hasOwnProperty('broadcaster')) {
                console.log(message);
                console.log(tags);
            }
            break;
        case '!rango':
            client.say(channel, `${tags.username} ${dimeMiRango(tags.badges)}`);
            break;
        case '!piropo':
            client.say(channel, `${pickRandom(piropos)}`);
            break;
        case 'hola':
            client.say(channel, `Hola, ${tags.username}`);
            break;
        case '!dado':
            client.say(channel, `Has sacado un, ${dado()}`);
            break;
        case '!vidas':
            client.say(channel, `${registerUserAndCount(tags.username)}`);
            break;
        case '!dc':
            client.say(channel, `https://discord.gg/d3xTjTwMXn`);
            break;
        case '!ig':
            client.say(channel, `https://bit.ly/3ky9kv5`);
            break;
        case '!tw':
            client.say(channel, `https://bit.ly/3Fb6vba`);
            break;
        case '!social':
            client.say(channel, `DC: https://discord.gg/d3xTjTwMXn, IG: https://bit.ly/3ky9kv5, TW: https://bit.ly/3Fb6vba`);
            break;
        case '!mostrarnr':
            if(tags.badges != null && tags.badges != undefined && (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem'))
                client.say(channel, `El número es ${magicNumber}`);
            break;
        case '!creador':
            client.say(channel, 'El nombre de mi creador es @noctismaiestatem (twitch.tv/noctismaiestatem)');
            break;
    };
});


/**
 * 
 * @param {*} lvl 0, 1, 2 = (nobody), (mod, sub, vip), (broadcaster)
 * @param {*} menu if true show commands avaible
 * @param {*} help command to show help [optional]
 * @returns 
 */
function helpMenu(lvl, menu, help){
    const main = {
        'delete': 'BETA, no hay nada que saber de esto hasta que esté completo. No es peligroso usarlo',
        'deftts': 'Establece el modo tts a hablar (por defecto: lento) para todo el chat y durante todo el stream. El -m es para el tts monguer y el -l es para el tts lento. EJ: !deftts -m, !deftts -l',
        'excluir':'Inhabilitará comandos para gente con permisos a pesar de tenerlos. EJ: !excluir anonymous',
        'incluir':'Revertirá las acciones del comando !excluir. EJ: !incluir anonymous',
        'insulto': 'Devolverá al chat un insulto al azar',
        'piropo': 'Devolverá al chat un piropo al azar',
        'rango': 'Te dirá qué rango tienes',
        'creador': 'Hará un poco de spam a @NoctisMaiestatem que es el que ha creado el bot',
        'dado': 'Devolverá un número al azar entre el uno y el seis',
        'hora': '!hora ES devolverá la hora de las distintas zonas horarias dentro de un país (si no te sabes el código de tu país búsca en google: ISO 3166-1 alfa-2)',
        'sonido': 'Reproduce uno de los sonidos de la lista (bofeton, pedo, pedomojado, gota, aplausos niños, alertasubnormal, recalculando, risatos, siuuu, estas tocandome, notificacion) según le indiques. EJ: !sonido bofeton',
        'tts': 'Leerá el mensaje que indiques. EJ: !tts Hola, ¿qué tal estás?',
        'ttsinsulto': 'Leerá un insulto al azar',
        'ttspiropo': 'Leerá un piropo al azar',
        'adivinaelnr': 'En cada partida se generará un número al azar del 1 al 50. Con !adivinaelnr puedes intentar adivinarlo, pero cuidado, solo tienes seis vidas. Si fallas se te restará una vida, por otro lado sí ganas se te sumará una. EJ: !adivinaelnr 13',
        'vidas': 'Con este comando puedes consultar cuántas vidas te quedan',
        'rvidas': 'Este comando sirve para restablecer la vida de un usuario. EJ: !rvidas noctismaiestatem',
        'mostrarnr': 'Este comando enseñará el número a adivinar en el chat.',
        'dc': 'Enlace de invitación al servidor de Discord',
        'ig': 'Enlace del instagram de AlberMarqui',
        'tw': 'Enlace del twitter de AlberMarqui',
        'help': 'Este comando te devolverá la lista de comandos disponibles acorde a tu rango en el chat. Sí lo acompañas de algún otro comando te mostrará una descripción de lo que hace el comando especificado. EJ: !help tts'
    };

    const broadcasterCMD = ['mostrarnr', 'rvidas'];
    const specialsCMD = ['sonido', 'tts', 'ttsinsulto', 'ttspiropo', 'incluir', 'excluir', 'deftts', 'delete'];

    if(lvl == 0 && menu == true) return Object.keys(main).filter(cmd => !broadcasterCMD.includes(cmd)).filter(cmd => !specialsCMD.includes(cmd)).map(cmd => '!'+cmd).join(', ');
    if(lvl == 1 && menu == true) return Object.keys(main).filter(cmd => !broadcasterCMD.includes(cmd)).map(cmd => '!'+cmd).join(', ');
    if(lvl == 2 && menu == true) return Object.keys(main).map(cmd => '!'+cmd).join(', ');

    if(menu == false && help && main.hasOwnProperty(help)) {
        if(lvl == 0 && !broadcasterCMD.includes(help) && !specialsCMD.includes(help)) return main[help];
        if(lvl == 1 && !broadcasterCMD.includes(help)) return main[help];
        if(lvl == 2) return main[help];

        return 'No tienes permisos para ejecutar la ayuda de este comando';
    } else return `No existe el comando ${help} o lo has escrito mal`;

    return 'Hmmm. No debería haber pasado esto, avisa a @NoctisMaiestatem. Mientras tanto reinicia el bot.';
}
// client.on('resub', (channel, username, months, message, userstate, methos) => {
//     client.say(channel, `¡El cabronazo de ${username} lleva ya ${months} meses suscrito!`);
// });

function registerUserAndCount(name, opt){
    const totalLifes = 6;

    if(!OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;

    if(opt === 'reset' && OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;
    if(OBJECT_PEOPLE_LIFES[name] == 0) return false;

    if(opt === 'rest') OBJECT_PEOPLE_LIFES[name] -= 1;
    if(opt === 'sum') OBJECT_PEOPLE_LIFES[name] += 1;

    return `Te quedan ${OBJECT_PEOPLE_LIFES[name]}`;
}

// @TODO: En un futuro añadir 3 vidas y cuando se acaben ya no poder jugar más en ese stream
// Eso supondrá que necesitaremos otra función que devuelvan las vidas de cada uno de los usuarios
function takeAGuess(nr, name){
    const min = 1;
    const max = 50;
    const errMessage = `Tienes que introducir un número entre el ${min} y el ${max}`;
    nr = parseInt(nr); 
    console.log(`El usuario ha introducido: ${nr}`);

    if(!nr) return errMessage;
    if(nr > max) return errMessage;
    if(nr < min) return errMessage;
    if(registerUserAndCount(name) == false) return `@${name} has muerto en una feroz batalla, más suerte la próxima vez, máquina.`;

    if(nr == magicNumber) {
        previousNumber = magicNumber;
        do {
            magicNumber=getRandInt(min, max);
        } while (magicNumber == previousNumber);
        console.log(`El nuevo número que se ha generado es el ${magicNumber}`);
        registerUserAndCount(name, 'sum');
        talkToMe(`${name} ha ganado un pin por adivinar el número ${previousNumber}`);
        return `Efectivamente, el número era ${previousNumber}. ¡Has ganado un pin!`;
    }

    registerUserAndCount(name, 'rest');
    return 'Más suerte a la próxima';
}

function getRandInt(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum)) + minimum;
}

// addOrSubMinutes(-120)
// addOrSubMinutes(120)
function addOrSubMinutes(min){
    return moment().add(min, 'minutes').toDate();
}

function calculateHour(tzone){    
    let minutesToAdd = [];
    let names = [];
    let country = ct.getCountry(tzone); //RO, ES 

    country.timezones.forEach(timezone => {
        minutesToAdd.push((ct.getTimezone(timezone)).utcOffset);
        names.push((ct.getTimezone(timezone)).name);
    });

    let finalHours = [];
    minutesToAdd.forEach(zone => finalHours.push(moment(addOrSubMinutes(zone)).utc().format('HH:hh')));
    let str = '';
    finalHours.forEach((f, i) => {
        if(i == 0) str+=`${names[i].split('/').pop().replace('_', ' ')} - ${f}`;
        else str+=`, ${names[i].split('/').pop().replace('_', ' ')} - ${f}`;
    });
    return str;
}
// console.log(calculateHour('RU'));

function encodeRust(text){
    text = text.toLowerCase();
    text = text.replace('á', 'a');
    text = text.replace('í', 'i');
    text = text.replace('ó', 'o');
    text = text.replace('é', 'e');
    text = text.replace('ú', 'u');
    text = text.replace('ç', 'shh');
    text = text.replace('eé', 'ee');
    text = text.replace('üi', 'wi');
    text = text.replace('üe', 'we');
    text = text.replace('ñ', 'ny');
    text = text.replace('ll', 'ya');

    return text;
}

function talkToMe(text){
    if(process.platform != 'win32'){
        console.log('No funcionará en otra plataforma que no sea Windows');
        return;
    }
    if(text == undefined || text.length == 0) return;
    let commands = [ 'Add-Type -AssemblyName System.speech; $speak = New-Object System.Speech.Synthesis.SpeechSynthesizer; $speak.Rate = 1.2; $speak.Speak([Console]::In.ReadToEnd())' ];
    let options = { shell: true };
    let childD = proc.spawn('powershell', commands, options);
    text = encodeRust(text);
    childD.stdin.end(iconv.encode(text, 'UTF-8'));
}


function isBroadcasterWhoCalls(tags){
    if((tags.badges != null && tags.badges != undefined && tags.badges.hasOwnProperty('broadcaster') && tags.badges.broadcaster === '1') || tags.username.toLowerCase() == 'noctismaiestatem') return true;
}

function isModWhoCalls(tags){
    if(isBroadcasterWhoCalls(tags)) return true;
    if(tags.badges != null && tags.badges != undefined && tags.badges.hasOwnProperty('moderator')) return true;
}

function onlySubsAllowed(tags){
    if(!SUBS) return true;

    if(tags.badges != null && tags.badges != undefined && tags.badges.hasOwnProperty('broadcaster') && tags.badges.broadcaster === '1') return true;

    if(tags.badges != null && tags.badges != undefined){
        if(tags.badges.hasOwnProperty('vip')) return true;
        if(tags.badges.hasOwnProperty('moderator')) return true;
        if(tags.badges.hasOwnProperty('founder')) return true;
        if(tags.badges.hasOwnProperty('premium')) return true;
        if(tags.badges.hasOwnProperty('suscriber')) return true;
    }
}
 
function checkFileExists(path){
    try {
        if (fs.existsSync(path)) {
          return true;
        }
      } catch(err) {
        console.error(err);
        return false;
      }

      return false;
}

function downloadFile(url, pathToSave){
    request(url).pipe(fs.createWriteStream(pathToSave));
}

function playSound(w){
    const baseURL = 'https://github.com/ArsDankeZik/MarquiBot/raw/main/sounds/';
    const nameFiles = 'gemido,alertasubnormal,aplausosniños,bofetón,estastocandome,gota,pedo_mojado,pedo_normal,recalculando,risacontos,siuuu,sorpresa_aplausos,suspense,whatsappweb'.split(',');

    nameFiles.forEach(element => {
        const localPath = `sounds/${element}.mp3`
        if(!checkFileExists(localPath)) downloadFile(`${encodeURI(baseURL)}${encodeURI(element)}.mp3`, localPath);
    });
    
    
    if(w === 'bofeton') sound.play(path.join(__dirname, "sounds/bofetón.mp3"), VOL);
    if(w === 'pedo') sound.play(path.join(__dirname, "sounds/pedo_normal.mp3"), VOL);
    if(w === 'pedomojado') sound.play(path.join(__dirname, "sounds/pedo_mojado.mp3"), VOL);
    if(w === 'gota') sound.play(path.join(__dirname, "sounds/gota.mp3"), VOL);
    if(w === 'aplausos niños') sound.play(path.join(__dirname, "sounds/aplausosniños.mp3"), VOL);
    if(w === 'alertasubnormal') sound.play(path.join(__dirname, "sounds/alertasubnormal.mp3"), VOL);
    if(w === 'recalculando') sound.play(path.join(__dirname, "sounds/recalculando.mp3"), VOL);
    if(w === 'risatos') sound.play(path.join(__dirname, "sounds/risacontos.mp3"), VOL);
    if(w === 'siuuu') sound.play(path.join(__dirname, "sounds/siuuu.mp3"), VOL);
    if(w === 'estas tocandome') sound.play(path.join(__dirname, "sounds/estastocandome.mp3"), VOL);
    if(w === 'notificacion') sound.play(path.join(__dirname, "sounds/whatsappweb.mp3"), VOL);
    // if(w === 'gemido') sound.play(path.join(__dirname, "sounds/gemido.mp3"), VOL);
}

function dimeMiRango(badge){
    let str = '';
    Object.keys(badge).forEach((rango, index) => {
        index === 0 ? str += rango : str += ', '+rango;
    });

    return `Rango/s: ${str}`;
}

function pickRandom(arr){
    const min = 0;
    const max = arr ? arr.length : 0;
    const rand = (Math.floor(Math.pow(10,14)*Math.random()*Math.random())%(max-min+1))+min;
    return arr[rand];
}

function dado(){
    const min = 1;
    const max = 6;
    const rand = (Math.floor(Math.pow(10,14)*Math.random()*Math.random())%(max-min+1))+min;
    return rand;
}
