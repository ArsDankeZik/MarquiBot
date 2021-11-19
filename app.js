require('dotenv').config();

const tmi = require('tmi.js');
const iconv = require('iconv-lite');
const proc = require('child_process');
const fs = require('fs');
const path = require('path');
const request = require('request');
const sound = require('sound-play');
const piropos = require('./piropos').piropos;
const insultos = require('./insultos').insultos;
const axios = require('axios');

// Variables para el programa
const SUBS = true; // CONSTANTE GLOBAL PARA HABILITAR CIERTOS COMANDOS SOLO PARA SUBS/VIPS/MODS
const VERSION = '1.3.1';
const RESTRICTED_WORDS = ['nigga', 'nigger', 'nigg', 'negrata', 'puta', 'maricón'];
var VOL = 1; // Controla el volumen de los sonidos !sonido
var magicNumber = getRandInt(1, 50);
var previousNumber = -1;
var codeGame = '';
var joinSayHi = false;
OBJECT_PEOPLE_LIFES = {};
USER_OBJECT = {};
EXCEPT_FROM_PERMISSION_LIST = [];

console.log(`El número a adivinar es: ${magicNumber}`);
// LINK PARA HACER IMPLEMENTAR CANJEAR POR PUNTOS https://www.twitch.tv/videos/806178796?collection=E1yJPFFiSBZBrQ

const options = {
    options: {
        debug: true,
        messagesLogLevel: 'info'
    },
    connection: {
        reconnect: true,
        secure: true
    },
    identity: {
        username: `${process.env.TWITCH_USERNAME}`,
        password: `oauth:${process.env.TWITCH_OAUTH}`
    },
    channels: [`${process.env.TWITCH_CHANNEL}`]
};

const whisperOptions = {
    options: options.options,
    connection: {
        cluster: 'group',
        reconnect: true
    },
    identity: options.identity
}

const client = new tmi.Client(options);
const whisperClient = new tmi.Client(whisperOptions);

client.connect().catch(console.error);
whisperClient.connect().catch(console.error);

client.on('join', (channel, username, self) => {
    if(!joinSayHi){
        client.say(channel, '¡Ya estoy de vuelta por aquí!')
        joinSayHi = true;
    }
});

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    if (tags.username.toLowerCase() === 'streamelements') return;
    //Normalize cmd and check if include cmd
    const msgIncludesCMD = (cmd, message) => message.toLowerCase().includes(cmd) ? true : false;
    //Normalize cmd and check if cmd and message match
    const msgIsCMD = (cmd, message) => message.toLowerCase().split(' ')[0] == cmd ? true : false;

    //Restrict perms on user doesn't matter if have vip, sub, mod
    const excludeFromPermissions = (user) => EXCEPT_FROM_PERMISSION_LIST.push(user);
    const deleteFromExcludeFromPermissions = (user) => EXCEPT_FROM_PERMISSION_LIST = EXCEPT_FROM_PERMISSION_LIST.filter(r => r != user);

    //Check lvl and return parsed level for help command
    const checkLVL = (tags) => {
        if (tags.badges != null && tags.badges != undefined) {
            if (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem') return 2;
            if (tags.badges.hasOwnProperty('vip') || tags.badges.hasOwnProperty('moderator') || tags.badges.hasOwnProperty('founder') || tags.badges.hasOwnProperty('premium') || tags.badges.hasOwnProperty('subscriber')) return 1;
        }
        return 0;
    };
    // haystack array to search arr to check
    const intersect = (haystack, arr) => {
        return arr.some(v => haystack.includes(v.toLowerCase()));
    };

    // if (msgIsCMD('!delete', message)) {
    //     if (isModWhoCalls(tags)) {
    //         console.log(tags);
    //         whisperClient.whisper('noctismaiestatem', 'Utilizando el comando !delete');
    //         client.deletemessage(channel, tags.id);
    //     }
    // }

    if (msgIncludesCMD('!memide', message)) {
        const params = [channel, tags, message, '!memide', false, []];
        const value = cleanCommandListener(params);
        const memide = getRandInt(1, 35);
        const frase = (cm) => {
            if (cm > 0 && cm <= 13) return `Según la RAE tu pene de ${cm} cm pasa a ser una pena`;
            else if (cm > 13 && cm <= 22) return `Tu pene de ${cm} cm no es para tanto a no ser que sepas usarlo`;
            else if (cm > 22 && cm <= 35) return `Este pene de ${cm} cm está hecho para matar y no para dar placer`;
            else return `No he podido calcular tu pene`;
        }

        client.say(channel, `@${tags.username}: ${frase(memide)}`);
    }

    if (msgIncludesCMD('!volumen', message)) {
        if (isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!volumen', true, []];
            const value = cleanCommandListener(params);

            if (value) setVolume(parseFloat(value));
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }

    if(msgIncludesCMD('!setcode', message)){
        if(isModWhoCalls(tags)){
            const params = [channel, tags, message, '!setcode', true, []];
            const code = cleanCommandListener(params);
            console.log(code);
            if(code != true){
                codeGame = code;
                client.say(channel, 'El código fue establecido');
            } else client.say(channel, `Esto no tiene sentido para mi`);
        }
    }

    if(msgIncludesCMD('!code', message)){
        if(codeGame && codeGame.length > 2) client.say(channel, `El último código que soy capaz de recordar es el ${codeGame.toUpperCase()}`);   
        else client.say(channel, `No me han asignado aún ningún código...`);   
    }

    if(msgIncludesCMD('!resetvoice', message)){
        if(!resetVoiceForUser(tags.username)) client.say(channel, `Has sobrepasado el limite de veces que puedes usar este comando`);
    }

    if (msgIncludesCMD('!excluir', message)) {
        if (isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!excluir', true, []];
            const username = cleanCommandListener(params);
            if (username) excludeFromPermissions(username);
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }

    if (msgIncludesCMD('!incluir', message)) {
        if (isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!incluir', true, []];
            const username = cleanCommandListener(params);
            if (username) deleteFromExcludeFromPermissions(username);
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }

    if (msgIncludesCMD('!ttsinsulto', message)) {
        const params = [channel, tags, message, '!ttsinsulto', true, EXCEPT_FROM_PERMISSION_LIST];
        const value = cleanCommandListener(params);

        if (value) {
            talkToLocal(tags.username, pickRandom(insultos));
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if (msgIncludesCMD('!ttspiropo', message)) {
        const params = [channel, tags, message, '!ttspiropo', true, EXCEPT_FROM_PERMISSION_LIST];
        const value = cleanCommandListener(params);

        if (value) {
            talkToLocal(tags.username, pickRandom(piropos));
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if (msgIsCMD('!tts', message)) {
        const params = [channel, tags, message, '!tts', true, EXCEPT_FROM_PERMISSION_LIST];
        const value = cleanCommandListener(params);

        if (value) {
            talkToLocal(tags.username, value);
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if (message.toLowerCase().includes('!sonido')) {
        msg = message.replace('!sonido', '').trim();
        if(!msg) client.say(channel, `Te has olvidado de indicar que tipo de sonido reproducir. ${ helpMenu(checkLVL(tags), false, 'sonido') }`);
        onlySubsAllowed(tags) ? playSound(`${msg}`) : client.say(channel, `@${tags.username} no tienes permitido realizar esta acción`);
    }

    if (message.toLowerCase().includes('!adivina')) {
        msg = message.replace('!adivina', '').trim();
        client.say(channel, `${ takeAGuess(msg, tags.username) }`);
    }

    if (message.toLowerCase().includes('!rvidas')) {
        msg = message.toLowerCase().replace('!rvidas', '').trim();
        if (tags.badges != null && tags.badges != undefined && (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem')) {
            console.log(msg);
            if (!msg || msg.length == 0) client.say(channel, `El comando es !rvidas nombreusuario (sin @)`);
            else client.say(channel, `${registerUserAndCount(msg, 'reset')}`);
        }
    }

    if (message.toLowerCase().includes('!help')) {
        msg = message.replace('!help', '').trim();
        msg = msg.replace('!', '');
        menu = msg.length == 0;

        if (menu) client.say(channel, `Escribe !help comando(sustituye comando por el comando que quieras consultar, no me seas borrego) para saber más acerca de un comando. Comandos disponibles: ${helpMenu(checkLVL(tags), true, null)}`);
        if (!menu) client.say(channel, `${helpMenu(checkLVL(tags), false, msg)}`);
    }

    if(message.toLowerCase().includes('hola')){
        client.say(channel, `Hola a ti también, @${tags.username}`);
    }

    if(intersect(RESTRICTED_WORDS, message.toLowerCase().split(' '))) client.say(channel, `Cuidado con lo que dices, @${tags.username}, o dependiendo de la gravedad de tus palabras uno de nuestros queridos mods te puede poner un timeout/ban`);
    if(intersect(['puta', 'furcia', 'zorra', 'guarra', 'maricona', 'malparido'], message.toLowerCase().split(' '))) client.say(channel, `Quizás deberías moderar tu lenguaje estimado/a @${tags.username}`);
    if(intersect(['twitter', 'tw'], message.toLowerCase().split(' '))) client.say(channel, `El twitter de AlberMarqui es https://bit.ly/3Fb6vba`);
    if(intersect(['instagram', 'ig'], message.toLowerCase().split(' '))) client.say(channel, `El instagram de AlberMarqui es https://bit.ly/3ky9kv5`);
    if(intersect(['discord', 'dc'], message.toLowerCase().split(' '))) client.say(channel, `El discord del canal es https://discord.gg/d3xTjTwMXn`);
    if(intersect(['código', 'codigo', 'code'], message.toLowerCase().split(' ')) || intersect(message.toLowerCase().split(' '), ['código', 'codigo', 'code'])) {
        console.log('Me ha parecido que han pedido el código del juego');
        if(!codeGame && !codeGame.length > 2) console.log('¿Es posible que no haya ningún código establecido?');
        else if(codeGame && codeGame.length > 2) client.say(channel, `El último código que me han registrado mis amos es ${codeGame.toUpperCase()}`);
    }

    switch (message.toLowerCase()) {
        case '!insulto':
            client.say(channel, `${pickRandom(insultos)}`);
            break;
        case '!log':
            // hace un sequimiento de los tags del usuario (mod o broadcaster) por consola
            if (isModWhoCalls(tags)) {
                console.log(message);
                console.log(tags);
            }
            break;
        case '!log-user':
            // hace un seguimiento de los tags del cualquier tipo de usuario por consola
            console.log(message);
            console.log(tags);
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
            if (tags.badges != null && tags.badges != undefined && (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem'))
                if (isModWhoCalls(tags)) console.log(channel, `El número es ${magicNumber}`);
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
function helpMenu(lvl, menu, help) {
    const main = {
        // 'delete': 'BETA, no hay nada que saber de esto hasta que esté completo. No es peligroso usarlo',
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
        'sonido': 'Reproduce uno de los sonidos de la lista (bofeton, pedo, pedomojado, gota, aplausos niños, alertasubnormal, recalculando, risatos, siuuu, estas tocandome, notificacion) según le indiques. EJ: !sonido bofeton',
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

function setVolume(n) {
    (n >= 0.0 && n <= 2.0) ? VOL = n: VOL = 0.85;
    console.log(`New volume set to: ${VOL}`);
}

//UNTESTED
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

function cleanCommandListener(arr) {
    [channel, tags, message, cmd, permission, permissionExceptions] = arr;
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

function talkToLocal(username, text) {
    if(!username || !text || username.length > 1 || text.length > 1) return;
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

function registerUserAndCount(name, opt) {
    const totalLifes = 6;

    if (!OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;

    if (opt === 'reset' && OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;
    if (OBJECT_PEOPLE_LIFES[name] == 0) return false;

    if (opt === 'rest') OBJECT_PEOPLE_LIFES[name] -= 1;
    if (opt === 'sum') OBJECT_PEOPLE_LIFES[name] += 1;

    return `Te quedan ${OBJECT_PEOPLE_LIFES[name]}`;
}

// @TODO: En un futuro añadir 3 vidas y cuando se acaben ya no poder jugar más en ese stream
// Eso supondrá que necesitaremos otra función que devuelvan las vidas de cada uno de los usuarios
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

function getRandInt(minimum, maximum) {
    return Math.floor(Math.random() * (maximum - minimum)) + minimum;
}

function encodeRust(text) {
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

function checkFileExists(path) {
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

function downloadFile(url, pathToSave) {
    request(url).pipe(fs.createWriteStream(pathToSave));
}

function playSound(w) {
    const baseURL = 'https://github.com/ArsDankeZik/MarquiBot/raw/main/sounds/';
    const nameFiles = 'gemido,alertasubnormal,aplausosniños,bofetón,estastocandome,gota,pedo_mojado,pedo_normal,recalculando,risacontos,siuuu,sorpresa_aplausos,suspense,whatsappweb'.split(',');

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
    if (w === 'recalculando') sound.play(path.join(__dirname, "sounds/recalculando.mp3"), VOL);
    if (w === 'risatos') sound.play(path.join(__dirname, "sounds/risacontos.mp3"), VOL);
    if (w === 'siuuu') sound.play(path.join(__dirname, "sounds/siuuu.mp3"), VOL);
    if (w === 'estas tocandome') sound.play(path.join(__dirname, "sounds/estastocandome.mp3"), VOL);
    if (w === 'notificacion') sound.play(path.join(__dirname, "sounds/whatsappweb.mp3"), VOL);
    // if(w === 'gemido') sound.play(path.join(__dirname, "sounds/gemido.mp3"), VOL);
}

function dimeMiRango(badge) {
    let str = '';
    Object.keys(badge).forEach((rango, index) => {
        index === 0 ? str += rango : str += ', ' + rango;
    });

    return `Rango/s: ${str}`;
}

function pickRandom(arr) {
    const min = 0;
    const max = arr ? arr.length - 1 : 0;
    const rand = () => (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min + 1)) + min;

    return arr[rand()];
}

function dado() {
    const min = 1;
    const max = 6;
    const rand = (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min + 1)) + min;
    return rand;
}