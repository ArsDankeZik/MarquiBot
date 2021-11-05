require('dotenv').config();
const tmi = require('tmi.js');
const iconv = require('iconv-lite');
const proc = require('child_process');
const ct = require('countries-and-timezones');
const moment = require('moment');
const path = require('path');
const sound = require('sound-play');
const gtts = require('node-gtts')('es');
const piropos = require('./piropos').piropos;
const insultos = require('./insultos').insultos;

// Variables para el programa
var filepath = path.join(__dirname, 'prueba.wav');
const SUBS = true; // CONSTANTE GLOBAL PARA HABILITAR CIERTOS COMANDOS SOLO PARA SUBS/VIPS/MODS
const VOL = 0.2; // Controla el volumen de los sonidos !sonido
const VERSION = '1.2.4';
var magicNumber = getRandInt(1, 50);
var previousNumber = -1;
var OBJECT_PEOPLE_LIFES = {};
console.log(magicNumber);

// LINK PARA HACER IMPLEMENTAR CANJEAR POR PUNTOS https://www.twitch.tv/videos/806178796?collection=E1yJPFFiSBZBrQ

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

client.connect().catch(console.error);

client.on('message', (channel, tags, message, self) => {
    if(self) return;
    if(tags.username.toLowerCase() === 'streamelements') return;
    // console.log(tags);

    
    if(message.toLocaleLowerCase().includes('!ttsinsulto')){
        msg = message.replace('!ttsinsulto', '');
        onlySubsAllowed(tags) ? 
            talkToMe(`${tags.username} dice ${pickRandom(insultos)}`) : 
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
    }

    if(message.toLocaleLowerCase().includes('!ttspiropo')){
        // console.log(message);
        msg = message.replace('!ttspiropo', '');
        onlySubsAllowed(tags) ? 
            talkToMe(`${tags.username} dice ${pickRandom(piropos)}`) : 
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
    }

    if(message.toLocaleLowerCase().includes('!tts') && !message.toLocaleLowerCase().includes('v2') && !message.toLocaleLowerCase().includes('!ttsinsulto') && !message.toLocaleLowerCase().includes('!ttspiropo')){
        // console.log(message);    
        msg = message.replace('!tts', '');
        onlySubsAllowed(tags) ? 
            talkToMe(`${tags.username} dice ${msg}`) : 
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
    }

    if(message.toLocaleLowerCase().includes('!ttsinsultov2')){
        msg = message.replace('!ttsinsultov2', '');
        onlySubsAllowed(tags) ? 
            googleTalkToMe(`${tags.username} dice ${pickRandom(insultos)}`) : 
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
    }

    if(message.toLocaleLowerCase().includes('!ttspiropov2')){
        // console.log(message);
        msg = message.replace('!ttspiropov2', '');
        onlySubsAllowed(tags) ? 
            googleTalkToMe(`${tags.username} dice ${pickRandom(piropos)}`) : 
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
    }

    if(message.toLocaleLowerCase().includes('!ttsv2') && !message.toLocaleLowerCase().includes('!ttsinsulto') && !message.toLocaleLowerCase().includes('!ttspiropo')){
        // console.log(message);    
        msg = message.replace('!ttsv2', '');
        onlySubsAllowed(tags) ? 
            googleTalkToMe(`${tags.username} dice ${msg}`) : 
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
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
    
    switch(message.toLowerCase()){
        case '!insulto': 
            client.say(channel, `${pickRandom(insultos)}`);
            break;
        case '!log':
            if(tags.badge.hasOwnProperty('moderator') || tags.badges.hasOwnProperty('broadcaster')) console.log(tags);
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
        case '!mostrarnr':
            if(tags.badges != null && tags.badges != undefined && (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem'))
                client.say(channel, `El número es ${magicNumber}`);
            break;
        case '!creador':
            client.say(channel, 'El nombre de mi creador es @noctismaiestatem (twitch.tv/noctismaiestatem)');
            break;
        case '!help':
            client.say(channel, 
                `
                !insulto: te devolverá un insulto rándom || 
                !piropo: leerá por voz un piropo aleatorio || 
                !rango: te dirá qué tipo de miembro eres en la comunidad || 
                !creador: devolverá el nombre del creador del bot || 
                !dado: tirará un dado por ti ||
                !hora [ES, RO, RU, AR, CO]: devuelve la hora en estos países y sus diferentes zonas
                `);
            client.say(channel, 
                `
                !sonido [bofeton, pedo, pedomojado, sorpresa, aplausos, gota, aplausos niños, suspense]: reproduce uno de los sonidos de la lista (mod, vip, sub)||
                !tts: leerá tu mensaje por voz [beta] (mod, vip, sub) || 
                !ttsinsulto: leerá por voz un insulto aleatorio (mod, vip, sub) ||
                !ttspiropo: leerá por voz un piropo aleatorio (mod, vip, sub) ||
                !adivinaelnr [1, 2...50]: mini juego de adivinar el número con 6 vidas ||
                !vidas: te muestra las vidas que te quedan ||
                !rvidas [usuario]: te resetea la vida (solo el fundador y @NoctisMaiestatem) ||
                !mostrarnr: muestra el número a adivinar (solo el fundador y @NoctisMaiestatem)
                `);
            break;
    };
});

// client.on('resub', (channel, username, months, message, userstate, methos) => {
//     client.say(channel, `¡El cabronazo de ${username} lleva ya ${months} meses suscrito!`);
// });

function registerUserAndCount(name, opt){
    const totalLifes = 6;

    if(!OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;
    if(OBJECT_PEOPLE_LIFES[name] == 0) return false;

    if(opt === 'rest') OBJECT_PEOPLE_LIFES[name] -= 1;
    if(opt === 'sum') OBJECT_PEOPLE_LIFES[name] += 1;
    if(opt === 'reset' && OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;

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

function onlySubsAllowed(tags){
    if(!SUBS) return true;

    if(tags.badges != null && tags.badges != undefined && tags.badges.hasOwnProperty('broadcaster') && tags.badges.broadcaster === '1') return true;

    if(tags.badges != null && tags.badges != undefined){
        if(tags.badges.hasOwnProperty('vip')) return true;
        if(tags.badges.hasOwnProperty('moderator')) return true;
        if(tags.badges.hasOwnProperty('founder')) return true;
        if(tags.badges.hasOwnProperty('premium')) return true;
    }
}
 

function playSound(w){
    if(w === 'bofeton') sound.play(path.join(__dirname, "sounds/bofetón.mp3"), VOL);
    // if(w === 'gemido') sound.play(path.join(__dirname, "sounds/gemido.mp3"), VOL);
    if(w === 'pedo') sound.play(path.join(__dirname, "sounds/pedo_normal.mp3"), VOL);
    if(w === 'pedomojado') sound.play(path.join(__dirname, "sounds/pedo_mojado.mp3"), VOL);
    if(w === 'sorpresa') sound.play(path.join(__dirname, "sounds/sorpresa_aplausos.mp3"), VOL);
    if(w === 'aplausos') sound.play(path.join(__dirname, "sounds/sorpresa_aplausos.mp3"), VOL);
    if(w === 'gota') sound.play(path.join(__dirname, "sounds/gota.mp3"), VOL);
    if(w === 'aplausos niños') sound.play(path.join(__dirname, "sounds/aplausosniños.mp3"), VOL);
    if(w === 'suspense') sound.play(path.join(__dirname, "sounds/suspense.mp3"), VOL);
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