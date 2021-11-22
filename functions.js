const insultos = require('./insultos').insultos;
const piropos = require('./piropos').piropos;
const sound = require('sound-play');
const request = require('request');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const moment = require('moment');

const SUBS = true; // CONSTANTE GLOBAL PARA HABILITAR CIERTOS COMANDOS SOLO PARA SUBS/VIPS/MODS (no es necesario por más tiempo)
const RESTRICTED_WORDS = ['nigga', 'nigger', 'nigg', 'negrata', 'maricón', 'maricon'];
var VOL = 1;
var magicNumber = getRandInt(1, 50);
var previousNumber = -1;
var codeGame = '';
var joinSayHi = false;
var OBJECT_PEOPLE_LIFES = {};
var USER_OBJECT = {};
var EXCEPT_FROM_PERMISSION_LIST = [];

const dado = () => {
    const min = 1;
    const max = 6;
    const rand = (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min + 1)) + min;
    return rand;
};

const hora = () => {
    const dt = new Date();
    const hora = dt.getHours();
    const min = dt.getMinutes();
    const sec = dt.getSeconds();

    return `${hora}:${min}:${sec}`;
};

const donde = () => {
    return `Alber Marqui vive en un remoto, 
bello y pintoresco pueblo de la Comunidad de Madrid, 
dentro del Reino de España`;
}

const pickRandom = (arr) => {
    const min = 0;
    const max = arr ? arr.length - 1 : 0;
    const rand = () => (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min + 1)) + min;

    return arr[rand()];
}

const dimeMiRango = (user, badge) => {
    let str = '';
    Object.keys(badge).forEach((rango, index) => {
        index === 0 ? str += rango : str += ', ' + rango;
    });

    return `@${user} tiene los siguientes rangos: ${str}`;
}

function setVolume(n) {
    (n >= 0.0 && n <= 2.0) ? VOL = n: VOL = 0.85;
    console.log(`New volume set to: ${VOL}`);
}

const playSound = (w) => {
    const baseURL = 'https://github.com/ArsDankeZik/MarquiBot/raw/main/sounds/';
    const nameFiles = 'gemido,alertasubnormal,aplausosniños,bofetón,estastocandome,gota,pedo_mojado,pedo_normal,recalculando,siuuu,sorpresa_aplausos,suspense,whatsappweb,pegriloso,badumts'.split(',');

    nameFiles.forEach(element => {
        const localPath = `sounds/${element}.mp3`
        if (!checkFileExists(localPath)) downloadFile(`${encodeURI(baseURL)}${encodeURI(element)}.mp3`, localPath);
    });

    if (w === 'bofeton') sound.play(path.join(__dirname, "sounds/bofetón.mp3"), VOL);
    if (w === 'pedo') sound.play(path.join(__dirname, "sounds/pedo_normal.mp3"), VOL);
    if (w === 'pedomojado') sound.play(path.join(__dirname, "sounds/pedo_mojado.mp3"), VOL);
    if (w === 'gota') sound.play(path.join(__dirname, "sounds/gota.mp3"), VOL);
    if (w === 'aplausos niños') sound.play(path.join(__dirname, "sounds/aplausosniños.mp3"), VOL);
    if (w === 'alertasubnormal') sound.play(path.join(__dirname, "sounds/alertasubnormal.mp3"), VOL);
    if (w === 'siuuu') sound.play(path.join(__dirname, "sounds/siuuu.mp3"), VOL);
    if (w === 'estas tocandome') sound.play(path.join(__dirname, "sounds/estastocandome.mp3"), VOL);
    if (w === 'notificacion') sound.play(path.join(__dirname, "sounds/whatsappweb.mp3"), VOL);
    if (w === 'badumts') sound.play(path.join(__dirname, "sounds/badumts.mp3"), VOL);
    if (w === 'pegriloso') sound.play(path.join(__dirname, "sounds/pegriloso.mp3"), VOL);
    // if(w === 'gemido') sound.play(path.join(__dirname, "sounds/gemido.mp3"), VOL);
}

const checkFileExists = (path) => {
    try {
        if (fs.existsSync(path)) {
            return true;
        }
    } catch (err) {
        console.error(err);
        return false;
    }
    return false;
}

const downloadFile = (url, pathToSave) => {
    request(url).pipe(fs.createWriteStream(pathToSave));
}

function getRandInt(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum)) + minimum;
}

function isBroadcasterWhoCalls(tags) {
    if ((tags.badges != null && tags.badges != undefined && tags.badges.hasOwnProperty('broadcaster') && tags.badges.broadcaster === '1') || tags.username.toLowerCase() == 'noctismaiestatem') return true;
}

function isModWhoCalls(tags) {
    if (isBroadcasterWhoCalls(tags)) return true;
    if (tags.badges != null && tags.badges != undefined && tags.badges.hasOwnProperty('moderator')) return true;
}

function onlySubsAllowed(tags) {
    if (!SUBS) return true;
    if (tags.badges != null && tags.badges != undefined && tags.badges.hasOwnProperty('broadcaster') && tags.badges.broadcaster === '1') return true;
    if (tags.badges != null && tags.badges != undefined) {
        if (tags.badges.hasOwnProperty('vip')) return true;
        if (tags.badges.hasOwnProperty('moderator')) return true;
        if (tags.badges.hasOwnProperty('founder')) return true;
        if (tags.badges.hasOwnProperty('subscriber')) return true;
        // if(tags.badges.hasOwnProperty('premium')) return true;
    }
}

function takeAGuess(nr, name) {
    const min = 1;
    const max = 50;
    const errMessage = `Tienes que introducir un número entre el ${min} y el ${max}`;
    nr = parseInt(nr);
    console.log(`El usuario ha introducido: ${nr}`);

    if (!nr) return errMessage;
    if (nr > max) return errMessage;
    if (nr < min) return errMessage;
    if (registerUserAndCount(name) == false) return `@${name} has muerto en una feroz batalla, más suerte la próxima vez, máquina.`;

    if (nr == magicNumber) {
        previousNumber = magicNumber;
        do { 
            magicNumber = getRandInt(min, max);
        } while (magicNumber == previousNumber);
        console.log(`El nuevo número que se ha generado es el ${magicNumber}`);
        registerUserAndCount(name, 'sum');
        // return `${name} ha ganado un pin por adivinar el número ${previousNumber}`;
        return `Efectivamente, el número era ${previousNumber}. ¡Has ganado un pin!`;
    }

    registerUserAndCount(name, 'rest');
    let x, y;
    if(nr > magicNumber){
        x = nr;
        y = magicNumber;
    }
    else {
        y = nr;
        x = magicNumber;
    }

    if((x-y) < 2) return 'Te estás quemando';
    if((x-y) < 5) return 'Muy caliente';
    if((x-y) < 10) return 'Caliente';
    if((x-y) < 15) return 'Templado';
    if((x-y) < 25) return 'Frio';
    if((x-y) < 35) return 'Helado';
    if((x-y) >= 35) return 'Tan helado como una tumba en pleno invierno';

    return 'Más suerte a la próxima';
}

function registerUserAndCount(name, opt) {
    const totalLifes = 6;

    if(opt && opt === 'vidas') return `Te quedan ${OBJECT_PEOPLE_LIFES[name]} vidas`;
    if (!OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;

    if (opt === 'reset' && OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;
    if (OBJECT_PEOPLE_LIFES[name] == 0) return false;
    if (opt === 'rest') OBJECT_PEOPLE_LIFES[name] -= 1;
    if (opt === 'sum') OBJECT_PEOPLE_LIFES[name] += 1;
}

function talkToLocal(username, text) {
    if(!username || !text) return;
    if(text.length < 2 || username.length < 2) return;
    if(text == 'true' || text == true) return;

    text = text.toLowerCase();
    text.split(' ').forEach(word => {
        if (RESTRICTED_WORDS.includes(word)) {
            text = text.replace(word, 'impronunciable');
        }
    });

    text = `${username} dice ${text}`;
    let url = defineVoiceForUser({
        user: username,
        msg: text,
    });

    if (url) {
        axios.get(encodeURI(url)).catch(err => console.error(err));
    } else console.error(url);
}

function cleanCommandListener(arr) {
    [channel, tags, message, cmd, permission, permissionExceptions, client] = arr;
    if (permission) {
        if (!onlySubsAllowed(tags) || permissionExceptions.includes(tags.username)) {
            client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
            return false;
        }
    }
    msg = message.replace(cmd, '').toLowerCase().trim();
    if (msg.length == 0) return true;
    if (msg.length > 0) return msg;

    console.error('ERROR: Not expected to get at final of cleanCommandListener');
    return false;
}


function defineVoiceForUser(userVoice) {
    const getRandomPitch = (min, max) => (Math.random() * (min - max) + max).toFixed(2);
    const getRandomRate = (min, max) => (Math.random() * (min - max) + max).toFixed(2);
    const getRandomVoice = () => ['Helena', 'Pablo', 'Laura'][getRandInt(0, 2)];

    if (USER_OBJECT && !USER_OBJECT.hasOwnProperty(userVoice.user)) {
        USER_OBJECT[userVoice.user] = {
            rate: getRandomRate(1.25, 1.65),
            pitch: getRandomPitch(0.10, 1.25),
            voice: getRandomVoice(),
            reset: 0
        };
        return `http://localhost:3000/client?msg=${userVoice.msg}&voice=${USER_OBJECT[userVoice.user].voice}&rate=${USER_OBJECT[userVoice.user].rate}&pitch=${USER_OBJECT[userVoice.user].pitch}&volume=${VOL}&to=embian`;
    } else if (USER_OBJECT && USER_OBJECT.hasOwnProperty(userVoice.user)) {
        return `http://localhost:3000/client?msg=${userVoice.msg}&voice=${USER_OBJECT[userVoice.user].voice}&rate=${USER_OBJECT[userVoice.user].rate}&pitch=${USER_OBJECT[userVoice.user].pitch}&volume=${VOL}&to=embian`;
    } else return false;
}

function resetVoiceForUser(user){
    const getRandomPitch = (min, max) => (Math.random() * (min - max) + max).toFixed(2);
    const getRandomRate = (min, max) => (Math.random() * (min - max) + max).toFixed(2);
    const getRandomVoice = () => ['Helena', 'Pablo', 'Laura'][getRandInt(0, 2)];

    if(!USER_OBJECT.hasOwnProperty(user)){
        USER_OBJECT[user] = {
            rate: getRandomRate(1.25, 1.65),
            pitch: getRandomPitch(0.10, 1.25),
            voice: getRandomVoice(),
            reset: 0
        };
    }

    if (USER_OBJECT && USER_OBJECT.hasOwnProperty(user) && USER_OBJECT[user].reset < 3) {
        USER_OBJECT[user] = {
            rate: getRandomRate(1.25, 1.65),
            pitch: getRandomPitch(0.10, 1.25),
            voice: getRandomVoice(),
            reset: USER_OBJECT[user].reset+1
        };
        console.log(USER_OBJECT[user]);
        console.log(`La voz de ${user} ha cambiado`);
        return true;
    }

    return false;
}

/**
 * 
 * @param {*} lvl 0, 1, 2 = (nobody), (mod, sub, vip), (broadcaster)
 * @param {*} menu if true show commands avaible
 * @param {*} help command to show help [optional]
 * @returns 
 */
 function helpMenu(lvl, menu, help) {
    const main = {
        // 'delete': 'BETA, no hay nada que saber de esto hasta que esté completo. No es peligroso usarlo',
        // 'sonido': 'Reproduce uno de los sonidos de la lista (bofeton, pedo, pedomojado, gota, aplausos niños, alertasubnormal, siuuu, estas tocandome, notificacion, pegriloso, badumts) según le indiques. EJ: !sonido bofeton',
        'cumple': 'Muestra el tiempo restante para el cumpleaños del streamer',
        'hora': 'Indica la hora actual en la península Ibérica',
        'donde': 'Te dice el lugar en el que vive Alber Marqui',
        'resetvoice': 'Establece una nueva voz para cuando uses el tts, pero cuidado, solo se puede usar 3 veces este comando',
        'setcode': 'Establece el código de la partida para que el bot lo sople por el chat EJ: !setcode ABCDEF',
        'code': 'Devuelve el código de la partida en curso y el código establecido',
        'volumen': 'Establece el volumen de voz del bot, rango permitido 0.00 - 1.00 EJ: !volumen 0.95',
        'excluir': 'Inhabilitará comandos para gente con permisos a pesar de tenerlos. EJ: !excluir anonymous',
        'incluir': 'Revertirá las acciones del comando !excluir. EJ: !incluir anonymous',
        'insulto': 'Devolverá al chat un insulto al azar',
        'piropo': 'Devolverá al chat un piropo al azar',
        'rango': 'Te dirá qué rango tienes',
        'creador': 'Hará un poco de spam a @NoctisMaiestatem que es el que ha creado el bot',
        'dado': 'Devolverá un número al azar entre el uno y el seis',
        'tts': 'Leerá el mensaje que indiques. EJ: !tts Hola, ¿qué tal estás?',
        'ttsinsulto': 'Leerá un insulto al azar',
        'ttspiropo': 'Leerá un piropo al azar',
        'adivina': 'En cada partida se generará un número al azar del 1 al 50. Con !adivinaelnr puedes intentar adivinarlo, pero cuidado, solo tienes seis vidas. Si fallas se te restará una vida, por otro lado sí ganas se te sumará una. EJ: !adivinaelnr 13',
        'vidas': 'Con este comando puedes consultar cuántas vidas te quedan',
        'rvidas': 'Este comando sirve para restablecer la vida de un usuario. EJ: !rvidas noctismaiestatem',
        'mostrarnr': 'Este comando enseñará el número a adivinar en el chat',
        'memide': 'Este comando calculará el tamaño de tu nepe y lo mostrará por el chat de manera graciosa',
        'dc': 'Enlace de invitación al servidor de Discord',
        'ig': 'Enlace del instagram de AlberMarqui',
        'tw': 'Enlace del twitter de AlberMarqui',
        'social': 'Muestra los enlaces sociales del streamer',
        'help': 'Este comando te devolverá la lista de comandos disponibles acorde a tu rango en el chat. Sí lo acompañas de algún otro comando te mostrará una descripción de lo que hace el comando especificado. EJ: !help tts'
    };

    const broadcasterCMD = ['mostrarnr', 'rvidas', 'delete'];
    const specialsCMD = ['sonido', 'tts', 'ttsinsulto', 'ttspiropo', 'incluir', 'excluir', 'deftts', 'delete', 'volumen'];

    if (lvl == 0 && menu == true) return Object.keys(main).filter(cmd => !broadcasterCMD.includes(cmd)).filter(cmd => !specialsCMD.includes(cmd)).map(cmd => '!' + cmd).join(', ');
    if (lvl == 1 && menu == true) return Object.keys(main).filter(cmd => !broadcasterCMD.includes(cmd)).map(cmd => '!' + cmd).join(', ');
    if (lvl == 2 && menu == true) return Object.keys(main).map(cmd => '!' + cmd).join(', ');

    if (menu == false && help && main.hasOwnProperty(help)) {
        if (lvl == 0 && !broadcasterCMD.includes(help) && !specialsCMD.includes(help)) return main[help];
        if (lvl == 1 && !broadcasterCMD.includes(help)) return main[help];
        if (lvl == 2) return main[help];

        return 'No tienes permisos para ejecutar la ayuda de este comando';
    } else return `No existe el comando ${help} o lo has escrito mal`;

    return 'Hmmm. No debería haber pasado esto, avisa a @NoctisMaiestatem. Mientras tanto reinicia el bot.';
}

function alberMarqui(){
    let now = moment();
    let birth = moment([now.year(), 10, 27, 0, 0]);
    if(birth.diff(now, 'days') > 30) return `${birth.diff(now, 'months')} meses`;
    else return `${birth.diff(now, 'days')} días`;
}

module.exports.VOL = VOL;
module.exports.piropos = piropos;
module.exports.insultos = insultos;
module.exports.magicNumber = magicNumber;
module.exports.previousNumber = previousNumber;
module.exports.codeGame = codeGame;
module.exports.joinSayHi = joinSayHi;
module.exports.OBJECT_PEOPLE_LIFES = OBJECT_PEOPLE_LIFES;
module.exports.USER_OBJECT = USER_OBJECT;
module.exports.EXCEPT_FROM_PERMISSION_LIST = EXCEPT_FROM_PERMISSION_LIST;
module.exports.SUBS = SUBS;
module.exports.RESTRICTED_WORDS = RESTRICTED_WORDS;
module.exports.dado = dado;
module.exports.hora = hora;
module.exports.donde = donde;
module.exports.pickRandom = pickRandom;
module.exports.dimeMiRango = dimeMiRango;
module.exports.playSound = playSound;
module.exports.checkFileExists = checkFileExists;
module.exports.downloadFile = downloadFile;
module.exports.getRandInt = getRandInt;
module.exports.isBroadcasterWhoCalls = isBroadcasterWhoCalls;
module.exports.isModWhoCalls = isModWhoCalls;
module.exports.onlySubsAllowed = onlySubsAllowed;
module.exports.takeAGuess = takeAGuess;
module.exports.registerUserAndCount = registerUserAndCount;
module.exports.talkToLocal = talkToLocal;
module.exports.cleanCommandListener = cleanCommandListener;
module.exports.defineVoiceForUser = defineVoiceForUser;
module.exports.resetVoiceForUser = resetVoiceForUser;
module.exports.setVolume = setVolume;
module.exports.helpMenu = helpMenu;
module.exports.alberMarqui = alberMarqui;
