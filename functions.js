const sound = require('sound-play');
const request = require('request');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

const SUBS = true; // CONSTANTE GLOBAL PARA HABILITAR CIERTOS COMANDOS SOLO PARA SUBS/VIPS/MODS (no es necesario por más tiempo)
const RESTRICTED_WORDS = ['nigga', 'nigger', 'nigg', 'negrata', 'maricón', 'maricon'];
var bots = ['streamelements', 'streamlabs', 'nightbot', 'dixperbro'];
var VOL = 1;
var alreadyConnected = false;
var magicNumber = getRandInt(1, 50);
var previousNumber = -1;
var codeGame = '';
var OBJECT_PEOPLE_LIFES = {};
var USER_OBJECT = {};
var EXCEPT_FROM_PERMISSION_LIST = [];
var USER_SALUTED = [];
var streamerName = 'AlberMarqui';
var streamerBirthday = '26/11/1998';
var socialNetworks = {
    'youtube': '',
    'instagram': 'https://bit.ly/3ky9kv5',
    'twitter': 'https://bit.ly/3Fb6vba',
    'facebook': '',
    'snapchat': '',
    'discord': 'https://discord.gg/d3xTjTwMXn',
    'website': '',
    'telegram': '',
    'tiktok': 'https://bit.ly/3aoqglF'
};

//Normalize cmd and check if include cmd
const msgIncludesCMD = (cmd, message) => message.toLowerCase().includes(cmd) ? true : false;
//Normalize cmd and check if cmd and message match
const msgIsCMD = (cmd, message) => message.toLowerCase().split(' ')[0] == cmd ? true : false;
//Restrict perms on user doesn't matter if have vip, sub, mod
const excludeFromPermissions = (user) => EXCEPT_FROM_PERMISSION_LIST.push(user);
const deleteFromExcludeFromPermissions = (user) => EXCEPT_FROM_PERMISSION_LIST = EXCEPT_FROM_PERMISSION_LIST.filter(r => r != user);

const checkBotFromList = (username) => {
    return bots.includes(username);
};

//Check lvl and return parsed level for help command
const checkLVL = (tags) => {
    if (tags.badges != null && tags.badges != undefined) {
        if (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem') return 2;
        if (tags.badges.hasOwnProperty('vip') || tags.badges.hasOwnProperty('moderator') || tags.badges.hasOwnProperty('founder') || tags.badges.hasOwnProperty('premium') || tags.badges.hasOwnProperty('subscriber')) return 1;
    }
    return 0;
};

const isCustomReward = (tags) => {
    tags.hasOwnProperty('custom-reward-id') ? console.log(`El ID del custom reward es: ${tags['custom-reward-id']}`) : null;
    return tags.hasOwnProperty('custom-reward-id');
};

const showNetworks = (net = 'all') => {
    const upper = (s) => s.charAt(0).toUpperCase() + s.slice(1);

    if (net == 'all') {
        const data = Object.keys(socialNetworks).map((v, i) => {
            if (socialNetworks[v]) return `${upper(v)}: ${socialNetworks[v]}`;
        });

        return data.filter(r => r ? r : null).join(', ');
    } else return socialNetworks[net] ? socialNetworks[net] : null;
};

const modCMD = (_this) => {
    const [client, channel, message, tags] = _this;
    if(msgIncludesCMD('!modcmd', message) && isModWhoCalls(tags)){
        if(msgIncludesCMD('sonido', message)){
            const params = [channel, tags, message, '!modcmd sonido', false, [], client];
            const value = cleanCommandListener(params);
            playSound(value);
        }
    }
};

const meMide = (_this) => {
    const [client, channel, message, tags] = _this;
    if (msgIncludesCMD('!memide', message)) {
        const params = [channel, tags, message, '!memide', false, [], client];
        const value = cleanCommandListener(params);
        let memide = tags.username.toLowerCase() != 'noctismaiestatem' ? getRandInt(1, 35) : getRandInt(17, 35);
        const frase = (cm) => {
            if (cm > 0 && cm <= 13) return `Según la RAE tu pene de ${cm} cm pasa a ser una pena`;
            else if (cm > 13 && cm <= 22) return `Tu pene de ${cm} cm no es para tanto a no ser que sepas usarlo`;
            else if (cm > 22 && cm <= 35) return `Este pene de ${cm} cm está hecho para matar y no para dar placer`;
            else return `No he podido calcular tu pene`;
        }

        client.say(channel, `@${tags.username}: ${frase(memide)}`);
    }
};

const setVolumen = (_this) => {
    const [client, channel, message, tags] = _this;
    if (msgIncludesCMD('!volumen', message)) {
        if (isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!volumen', true, [], client];
            const value = cleanCommandListener(params);

            if (value) {
                n = parseFloat(value);
                (n >= 0.0 && n <= 2.0) ? VOL = n: VOL = 0.85;
                console.log(`New volume set to: ${VOL}`);
            }
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }
};

const setCode = (_this) => {
    const [client, channel, message, tags] = _this;
    if(msgIncludesCMD('!setcode', message)){
        if(isModWhoCalls(tags)){
            const params = [channel, tags, message, '!setcode', true, [], client];
            const code = cleanCommandListener(params);
            
            if(code != true){
                codeGame = code;
                client.say(channel, 'El código fue establecido');
            } else client.say(channel, `Esto no tiene sentido para mi`);
        }
    }
};

const showCode = (_this) => {
    const [client, channel, message, tags] = _this;
    if(msgIncludesCMD('!code', message)){
        if(codeGame && codeGame.length > 2) {
            const codeGamePrint = codeGame.includes('http') ? codeGame : codeGame.toUpperCase();
            client.say(channel, `El último código que soy capaz de recordar es el ${codeGamePrint}`);
        }
        else client.say(channel, `No me han asignado aún ningún código...`);   
    }
};

const resetVoice = (_this) => {
    const [client, channel, message, tags] = _this;
    if(msgIncludesCMD('!resetvoice', message)){
        if(!resetVoiceForUser(tags.username)) client.say(channel, `Has sobrepasado el limite de veces que puedes usar este comando`);
    }
};

const excluir = (_this) => {
    const [client, channel, message, tags] = _this;
    if (msgIncludesCMD('!excluir', message)) {
        if (isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!excluir', true, [], client];
            const username = cleanCommandListener(params);
            if (username) excludeFromPermissions(username);
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }
};

const incluir = (_this) => {
    const [client, channel, message, tags] = _this;

    if (msgIncludesCMD('!incluir', message)) {
        if (isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!incluir', true, [], client];
            const username = cleanCommandListener(params);
            if (username) deleteFromExcludeFromPermissions(username);
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }
};

const piropoInsulto = (_this) => {
    const [client, channel, message, tags] = _this;

    if (msgIncludesCMD('!ttsinsulto', message)) {
        const params = [channel, tags, message, '!ttsinsulto', true, EXCEPT_FROM_PERMISSION_LIST, client];
        const value = cleanCommandListener(params);

        if (value) {
            talkToLocal(tags.username, pickRandom(insultos), 'es');
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if (msgIncludesCMD('!ttspiropo', message)) {
        const params = [channel, tags, message, '!ttspiropo', true, EXCEPT_FROM_PERMISSION_LIST, client];
        const value = cleanCommandListener(params);

        if (value) {
            talkToLocal(tags.username, pickRandom(piropos), 'es');
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }
};

const tts = (_this) => {
    const [client, channel, message, tags] = _this;

    if (msgIsCMD('!tts', message)) {
        const params = [channel, tags, message, '!tts', true, EXCEPT_FROM_PERMISSION_LIST, client];
        const value = cleanCommandListener(params);

        if (value) {
            talkToLocal(tags.username, value, 'es');
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }
};

const adivina = (_this) => {
    const [client, channel, message, tags] = _this;

    if (message.toLowerCase().includes('!adivina')) {
        msg = message.replace('!adivina', '').trim();
        client.say(channel, `${ takeAGuess(msg, tags.username) }`);
    }
};

const dado = (n) => {
    const min = 1;
    const max = n;
    const rand = (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min + 1)) + min;
    return rand;
};

const tirarDado = (_this) => {
    const [client, channel, message, tags] = _this;

    if (msgIncludesCMD('!dado', message)) {
        const params = [channel, tags, message, '!dado', false, [], client];
        let value = cleanCommandListener(params);
        if (value == undefined || value == null || value == true) value = 6;
        console.log(value);
        if (!isNaN(value)) {
            client.say(channel, `Has sacado un ${dado(value)}`);
        }
    }
};

const rVidas = (_this) => {
    const [client, channel, message, tags] = _this;

    if (msgIncludesCMD('!rvidas', message)) {
        msg = message.toLowerCase().replace('!rvidas', '').trim();
        if (tags.badges != null && tags.badges != undefined && (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem')) {
            if (!msg || msg.length == 0) client.say(channel, `El comando es !rvidas nombreusuario (sin @)`);
            else {
                registerUserAndCount(msg, 'reset');
                client.say(channel, `Se han restablecido las vidas de ${ tags.username }`);
            }
        }
    }
};

const displayHelpMenu = (_this) => {
    const [client, channel, message, tags] = _this;

    if (msgIncludesCMD('!help', message)) {
        msg = message.replace('!help', '').trim();
        msg = msg.replace('!', '');
        menu = msg.length == 0;

        if (menu) client.say(channel, `Escribe !help comando(sustituye comando por el comando que quieras consultar, no me seas borrego) para saber más acerca de un comando. Comandos disponibles: ${ helpMenu(checkLVL(tags), true, null) }`);
        if (!menu) client.say(channel, `${ helpMenu(checkLVL(tags), false, msg) }`);
    }
};

const sayHello = (_this) => {
    const [client, channel, message, tags] = _this;
    if (message.toLowerCase().includes('hola')) {
        if (!USER_SALUTED.includes(tags.username)) {
            client.say(channel, `Hola a ti también, @${tags.username}`);
            USER_SALUTED.push(tags.username);
        }
    }
};

const intersect = (haystack, arr) => {
    return arr.some(v => haystack.includes(v.toLowerCase()));
};

function daysUntilNext(month, day){
    var tday= new Date(), y= tday.getFullYear(), next= new Date(y, month-1, day);
    tday.setHours(0, 0, 0, 0);
    if(tday>next) next.setFullYear(y+1);
    return Math.round((next-tday)/8.64e7);
}

const instersections = (_this) => {
    const [client, channel, message, tags] = _this;

    if(intersect(RESTRICTED_WORDS, message.toLowerCase().split(' '))) client.say(channel, `Cuidado con lo que dices, @${tags.username}, o dependiendo de la gravedad de tus palabras uno de nuestros queridos mods te puede poner un timeout/ban`);
    if(intersect(['puta', 'furcia', 'zorra', 'guarra', 'maricona', 'malparido'], message.toLowerCase().split(' '))) client.say(channel, `Quizás deberías moderar tu lenguaje estimado/a @${tags.username}`);
    if(intersect(['twitter', 'tw'], message.toLowerCase().split(' ')) && showNetworks('twitter')) client.say(channel, `El twitter de ${ streamerName } es ${ showNetworks('twitter') }`);
    if(intersect(['instagram', 'ig'], message.toLowerCase().split(' ')) && showNetworks('instagram')) client.say(channel, `El instagram de ${ streamerName } es ${ showNetworks('instagram') }`);
    if(intersect(['discord', 'dc'], message.toLowerCase().split(' ')) && showNetworks('discord')) client.say(channel, `El discord del canal es ${ showNetworks('discord') }`);
    if(intersect(['código', 'codigo', 'code'], message.toLowerCase().split(' ')) || intersect(message.toLowerCase().split(' '), ['código', 'codigo', 'code'])) {
        console.log('Me ha parecido que han pedido el código del juego');
        if(!codeGame && !codeGame.length > 2) console.log('¿Es posible que no haya ningún código establecido?');
        else if(codeGame && codeGame.length > 2) client.say(channel, `El último código que me han registrado mis amos es ${codeGame.toUpperCase()}`);
    }
};

const randomMeme = (io) => {
    fs.readdir('./memes', (err, files) => {
        if (err) console.error(err);
        else io.emit('meme', {memes: files});
    });
};

const switchCMD = (_this, io) => {
    const [client, channel, message, tags] = _this;

    switch (message.toLowerCase().trim()) {
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
        case '!meme':
            if (isModWhoCalls(tags)) {
                randomMeme();
            }
            break;
        case '!rango':
            client.say(channel, `${dimeMiRango(tags.username, tags.badges)}`);
            break;
        case '!hora':
            client.say(channel, `La hora actual en el Reino de España es ${hora()}`);
            break;
        case '!donde':
            client.say(channel, `${donde()}`);
            break;
        case '!cumple':
            client.say(channel, `El cumple de ${ streamerName } es el ${ streamerBirthday } y quedan ${ daysUntilNext(streamerBirthday.split('/')[1], streamerBirthday.split('/')[0]) } días`);
            break;
        case '!insulto':
            client.say(channel, `${pickRandom(insultos)}`);
            break;
        case '!piropo':
            client.say(channel, `${pickRandom(piropos)}`);
            break;
        case '!vidas':
            client.say(channel, `${registerUserAndCount(tags.username, 'vidas')}`);
            break;
        case '!yt':
            if(showNetworks('youtube')) client.say(channel, `${ showNetworks('youtube') }`);
            break;
        case '!dc':
            if(showNetworks('discord')) client.say(channel, `${ showNetworks('discord') }`);
            break;
        case '!ig':
            if(showNetworks('instagram')) client.say(channel, `${ showNetworks('instagram') }`);
            break;
        case '!tw':
            if(showNetworks('twitter')) client.say(channel, `${ showNetworks('twitter') }`);
            break;
        case '!social':
            if(showNetworks()) client.say(channel, `${ showNetworks() }`);
            break;
        case '!redes':
            if(showNetworks()) client.say(channel, `${ showNetworks() }`);
            break;
        case '!mostrarnr':
            if (tags.badges != null && tags.badges != undefined && (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem'))
                if (isModWhoCalls(tags)) console.log(channel, `El número es ${magicNumber}`);
            break;
        case '!creador':
            client.say(channel, 'El nombre de mi creador es @noctismaiestatem (https://twitch.tv/noctismaiestatem)');
            break;
    };
};


const hora = () => {
    let dt = new Date();
    let hora = dt.getHours();
    let min = dt.getMinutes();
    let sec = dt.getSeconds();

    if((hora).toString().length == 1) hora = `0${hora}`;
    if((min).toString().length == 1) min = `0${min}`;
    if((sec).toString().length == 1) sec = `0${sec}`;

    return `${hora}:${min}:${sec}`;
};

const donde = () => {
    return `${ streamerName } vive en un remoto, bello y pintoresco pueblo de la Comunidad de Madrid, dentro del Reino de España`;
};

const pickRandom = (arr) => {
    const min = 0;
    const max = arr ? arr.length - 1 : 0;
    const rand = () => (Math.floor(Math.pow(10, 14) * Math.random() * Math.random()) % (max - min + 1)) + min;

    return arr[rand()];
};

const dimeMiRango = (user, badge) => {
    let str = '';

    if(!badge) return `${ user } no tiene ningún rango`;

    Object.keys(badge).forEach((rango, index) => {
        index === 0 ? str += rango : str += ', ' + rango;
    });

    return `@${user} tiene los siguientes rangos: ${str}`;
};

function setVolume(n) {
    (n >= 0.0 && n <= 2.0) ? VOL = n: VOL = 0.85;
    console.log(`New volume set to: ${VOL}`);
}

const playSound = (w) => {
    const baseURL = 'https://github.com/ArsDankeZik/MarquiBot/raw/main/sounds/';
    const nameFiles = 'alertasubnormal,aplausosniños,bofeton,estastocandome,gota,pedo,pedomojado,recalculando,siuuu,sorpresa_aplausos,suspense,whatsappweb,pegriloso,badumts,ageofempires,among,banana,callalaboca,cerraelorto,discord,dorime,error,esecompa,esomentira,gilipollas,hellodarknessmyoldfriend,hellomf,hellothere,holajuancarlos,itwasthismoment,malditalisiada,mecagoentutia,mepicanloscocos,muertogtav,narutokun,nope,phubintro,quepaseeldesgraciado,quita,rajoyhacemosloquepodemos,risaibai,soyuntrolazo,troll,windows10error'.split(',');

    nameFiles.forEach(element => {
        const localPath = `sounds/${element}.mp3`
        if (!checkFileExists(localPath)) downloadFile(`${encodeURI(baseURL)}${encodeURI(element)}.mp3`, localPath);
    });

    if(nameFiles.includes(w)) sound.play(path.join(__dirname, `sounds/${w}.mp3`), VOL);
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

    if (opt && opt === 'vidas' && Object.keys(OBJECT_PEOPLE_LIFES).length == 0) return `Te quedan ${totalLifes} vidas`;
    if (opt && opt === 'vidas') return `Te quedan ${OBJECT_PEOPLE_LIFES[name]} vidas`;
    if (!OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;

    if (opt === 'reset' && OBJECT_PEOPLE_LIFES.hasOwnProperty(name)) OBJECT_PEOPLE_LIFES[name] = totalLifes;
    if (OBJECT_PEOPLE_LIFES[name] == 0) return false;
    if (opt === 'rest') OBJECT_PEOPLE_LIFES[name] -= 1;
    if (opt === 'sum') OBJECT_PEOPLE_LIFES[name] += 1;
}


function talkToLocal(username, text, lang='es') {
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

    let url = '';
    if (lang == 'es') url = defineVoiceForUser({
        user: username,
        msg: text,
    });

    url = url.replaceAll('noctismaiestatem', 'modnoctis').replaceAll('carljuez98', 'modcarljuez').replaceAll('leyenda2114', 'modleyenda');
    if (url) {
        axios.get(encodeURI(url)).catch(err => console.error(err));
    } else console.error(url);
}

function cleanCommandListener(arr) {
    [channel, tags, message, cmd, permission, permissionExceptions, client] = arr;
    if (permission) {
        if (!onlySubsAllowed(tags) || permissionExceptions.includes(tags.username)) {
            client.say(channel, `@${tags.username} este comando solo está para mods/vips/subs, consulta con !help los comandos que puedes realizar o suscríbete al canal`);
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
        console.log(`La voz de ${user} ha cambiado`);
        return true;
    }

    return false;
}

const displaySonido = (_this) => {
    const [client, channel, message, tags] = _this;
    if(msgIncludesCMD('!sonido', message)) client.say(channel, `Lista con los sonidos disponibles: https://bit.ly/3MpIYqg`);   
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
        'adivina': 'En cada partida se generará un número al azar del 1 al 50. Con !adivinaelnr puedes intentar adivinarlo, pero cuidado, solo tienes seis vidas. Si fallas se te restará una vida, por otro lado sí ganas se te sumará una. EJ: !adivinaelnr 13',
        'code': 'Devuelve el código de la partida en curso y el código establecido',
        'creador': 'Hará un poco de spam a @NoctisMaiestatem que es el que ha creado el bot',
        'cumple': 'Muestra el tiempo restante para el cumpleaños del streamer',
        'dado': 'Devolverá un número al azar entre el uno y el numero que le especifiques, sí no lo haces el máximo de caras serán seis. EJ: !dado 100',
        'dc': 'Enlace de invitación al servidor de Discord',
        'donde': 'Te dice el lugar en el que vive Alber Marqui',
        'excluir': 'Inhabilitará comandos para gente con permisos a pesar de tenerlos. EJ: !excluir anonymous',
        'help': 'Este comando te devolverá la lista de comandos disponibles acorde a tu rango en el chat. Sí lo acompañas de algún otro comando te mostrará una descripción de lo que hace el comando especificado. EJ: !help tts',
        'hora': 'Indica la hora actual en la península Ibérica',
        'ig': 'Enlace del instagram de AlberMarqui',
        'incluir': 'Revertirá las acciones del comando !excluir. EJ: !incluir anonymous',
        'insulto': 'Devolverá al chat un insulto al azar',
        'memide': 'Este comando calculará el tamaño de tu nepe y lo mostrará por el chat de manera graciosa',
        'mostrarnr': 'Este comando enseñará el número a adivinar en el chat',
        'piropo': 'Devolverá al chat un piropo al azar',
        'rango': 'Te dirá qué rango tienes',
        'resetvoice': 'Establece una nueva voz para cuando uses el tts, pero cuidado, solo se puede usar 3 veces este comando',
        'rvidas': 'Este comando sirve para restablecer la vida de un usuario. EJ: !rvidas noctismaiestatem',
        'setcode': 'Establece el código de la partida para que el bot lo sople por el chat EJ: !setcode ABCDEF',
        'social': 'Muestra los enlaces sociales del streamer',
        'sonido': 'Muestra un enlace donde están publicados todos los sonidos que puedes usar con el canje de puntos, sonido',
        'tts': 'Leerá el mensaje que indiques. EJ: !tts Hola, ¿qué tal estás?',
        'ttsinsulto': 'Leerá un insulto al azar',
        'ttspiropo': 'Leerá un piropo al azar',
        'tw': 'Enlace del twitter de AlberMarqui',
        'vidas': 'Con este comando puedes consultar cuántas vidas te quedan',
        'volumen': 'Establece el volumen de voz del bot, rango permitido 0.00 - 1.00 EJ: !volumen 0.95',
    };

    const broadcasterCMD = ['mostrarnr', 'rvidas', 'delete', 'volumen', 'modcmd', 'incluir', 'excluir', 'code', 'setcode'];
    const specialsCMD = ['sonido', 'tts', 'ttsinsulto', 'ttspiropo', 'resetvoice'];

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


const piropos = [
    'Quien fuera caramelo para poder derretirse en tu boca.',
    'Mi amor, tengo la caja fuerte para guardar ese lingote de oro.',
    '¿Y si nos comemos unos tacos y yo te a-taco a besos?',
    'Algún día Tom se comerá a Jerry, Silvestre a Piolín y yo a ti.',
    'No tengas miedo… sí que muerdo, pero muy suave.',
    'Quiero olvidarte, pero sin el “olvi”.',
    'Ni bañándome se me quitó todo lo sucio que quiero hacerte.',
    'Si, por otro lado, prefieres algunos Piropos de amor cortos y bonitos, en esta selección encontrarás ideas más light.',
    '¿Por qué en vez de un beso de buenas noches no me das una noche de buenos besos?',
    '¡Me encanta tu camisa! Creo que combinaría a la perfección con mis sábanas...',
    'Si yo fuera un avión y tú mi aeropuerto aterrizaría todos los días en tu exquisito cuerpo.',
    'Ojalá fueras sol y me dieras todo el día.',
    'Quisiera ser patata frita para acompañar ese lomo.',
    'Si fueras salsa, estaría mojando todo el día.',
    'Conmigo nunca te va a faltar amor. Y si te falta, lo hacemos…',
    'Tu ropa me da miedo. ¿Puedes quitártela?',
    'Dime como te llamas y así lograré ponerle un nombre a mis sueños',
    'Como mejor está ese cuerpo es sin ropa que lo adorne.',
    '¡Cuidado! Estás entrando en zona obligatoria de besos.',
    'Eres como la zapatilla de mi madre. Te veo venir y se me acelera el corazón.',
    'Ni en clase de matemáticas me pierdo tanto como en tu mirada...',
    'Estás como Paco… Paco-merte a besos.',
    'Mándame tu ubicación que quiero saber dónde está mi tesoro.',
    '¡Quién fuera paloma para posarme en esa rama!',
    'Ya tengo el Netflix, sólo me faltas tú a mi lado. Y date prisa, que sólo es el mes de prueba.',
    'Por darte un bocado me salto yo la dieta.',
    'Si vas a estar en mi cabeza todo el día, al menos ponte algo de ropa...',
    'Contigo me pasaría cien años en cuarentena.',
    'Ojalá te roben la cama y te vengas a dormir conmigo.',
    '¡Ya quisiera la Guardia Civil tener ese cuerpo!',
    'No sé si eres Bill Gates, pero pareces muy rico.',
    'Dicen que no hay hombre bueno, pero quiero descubrir si tú eres la excepción.',
    'Si estar bueno es un pecado, no tienes perdón de Dios.',
    'Si te gustan las alegrías, aquí tengo yo una para tu cuerpo.',
    'No seré agricultor, pero si me dejas te planto unos besos.',
    'Entre nosotros hay más química que en toda la tabla periódica.',
    '¡Quién fuera cinturón para recorrer esa cintura!',
    'Si supieras cuánto pienso en ti me denunciarías por acoso mental.',
    'Cómo le gustaría a mi madre que tú fueses su nuera...',
    'Quién fuera zapatero para trabajar ese cuero.',
    '¿No te da claustrofobia pasar todo el día en mi cabeza?',
    '¡Qué perrito más mono! ¿Tiene número de teléfono?',
    'Adán se comió la manzana, pero yo por ti me comería la frutería entera...',
    'Si fuera alcalde te hacía una plaza en mitad del pueblo.',
    'El amor será ciego, pero hay que ver lo que alegras la vista...',
    'Qué bonitos son los días de viento para faldas como esa.',
    '¡Cuéntame qué comes para estar tan buena!',
    'Me gusta mucho una persona, pero no te voy a decir quién es.',
    'Tarjeta amarilla por la falta que me haces.',
    'Lo mejor de ti es todo lo que te hace tan tú.',
    'Tienes algo pegado en el culo… ¡Mi mirada!',
    'Ni la miopía me impide ver lo guapa que eres.',
    'Si una amiga es un tesoro, tú eres una mina de oro.',
    '¡Con amigas como tú, quién necesita novio!',
    'Tú no necesitas que te dé el sol, tú brillas con luz propia.',
    'Por ti, mato un elefante a chancletazos.',
    'Aparte de la comida, tú eres lo que más me gusta.',
    'Sólo estoy a gusto cuando estoy contigo. Eres el pantalón del pijama de mi vida.',
    '¿Sabes por lo que estoy agradecida hoy? Por ser amigas. Y por la Nutella.',
    'No es fácil ser yo. Por eso te necesito a ti, amiga.',
    '¿Sabes lo que es increíble? Un pastel de chocolate... ¡ah, y tú tampoco estás mal!',
    'La parte más difícil de ser amigos es fingir que mis otros amigos me gustan tanto como tú.',
    'El amor será ciego, pero hay que ver lo mucho que alegras la vista.',
    'Con esos ojos mirándome, ya no me hace falta la luz del sol.',
    'Por la luna daría un beso, daría todo por el sol, pero por la luz de tu mirada, doy mi vida y corazón.',
    'Si yo fuera un avión y tu un aeropuerto, me la pasaría aterrizando por tu hermoso cuerpo.',
    'Me gusta el café, pero prefiero tener-té.',
    'No eres google, pero tienes todo lo que yo busco.',
    'Mis ganas de ti no se quitan, se acumulan.',
    'Cuando te multen por exceso de belleza, yo pagaré tu fianza.',
    'Si cada gota de agua sobre tu cuerpo es un beso, entonces quiero convertirme en aguacero.',
    'Estas como para invitarte a dormir, y no dormir.',
    'Si tu cuerpo fuera cárcel y tus brazos cadenas, ese sería el lugar perfecto para cumplir condena.',
    'Qué bonitos ojos tienes, tan redondos como el sol, se parecen a los ceros que me pone el profesor.'
];

const insultos = [
    'Hablando de madres: ¿es verdad que la tuya es tan gorda que tiene su propio código postal?',
    '¿Sabes?, yo podría haber sido tu padre, pero el tipo que estaba a mi lado tenía el dinero exacto',
    'Come-albóndigas',
    'Perroflauta',
    'Eres la versión antropomórfica de la Comic Sans',
    'Cara de limón podrído',
    'Eres más pesado que matar a un cerdo a besos',
    'Tienes halitosis…pero si lo supieras no hablarías tanto',
    'Tu mujer debe disfrutar cada vez que juegas. Más que nada porque por unas horas no tiene que aguantarte.',
    '¿Alguien te dijo alguna vez que eres una persona increíblemente promedio?',
    '¿Te das cuenta de que la gente solo te tolera?',
    'Deberías tratar de comer un poco de maquillaje para ser más bella por dentro.',
    'Disculpa pero tengo cosas mejores con las que perder el tiempo.',
    'Eres tan brillante como un agujero negro y el doble de denso.',
    'No tengo una respuesta apropiada para alguien de tu edad mental.',
    'Espero que el resto de tu día sea tan agradable como tú.',
    'Hay 7 trillones de nervios en el cuerpo humano, y tú irritas todos.',
    'La envidia es una enfermedad. Espero que te mejores.',
    'La gente feliz no tiene necesidad de amargar a los demás.',
    'Lástima que no puedas usar Photoshop en tu personalidad.',
    'Me asombra ver cómo le pones tanto entusiasmo a algo tan obvio.',
    'Me encanta cómo dices cosas obvias con la sensación de que descubriste algo.',
    'Me niego a pelear con un oponente desarmado.',
    'Mirar a alguien con impaciencia y decir: ¿Ya terminaste?',
    'No se qué cualidades puedes tener que compensen esa actitud que tienes.',
    'Puedo explicártelo pero no puedo entenderlo por ti.',
    'Que tengas un buen día, en cualquier otro lugar.',
    'Siento decirte que jamás pedí tu opinión. Gracias.',
    'Te devuelvo tu nariz. Se había metido en mis asuntos.',
    'Todas las personas que te amaron alguna vez estaban equivocados.',
    'Todo el mundo puede ser estúpido alguna vez, pero tú abusas del privilegio.',
    'Tu singular punto de vista nos ha dejado perplejo.',
    'Ya que lo sabes todo, sabrás cuándo callarte.',
    '¡Fuera! Eres veneno para mi sangre.',
    '¿Cuál es el parentesco entre tus padres?',
    'De no ser por la risa debería tenerte lastima.',
    'Jamás has usado una palabra que obligue a alguien a buscar un diccionario.',
    'Los asnos están hechos para cargar y, tu también.',
    'Me arrepiento de los tediosos minutos que he pasado contigo.',
    'No hay nada malo en ti que la reencarnación no pueda arreglar.',
    'No iré a tu funeral, pero enviaré una bonita carta aprobándolo.',
    'No tiene enemigos, pero es intensamente aborrecido por todos sus amigos.',
    'Tienes todas las virtudes que odio y ninguno de los vicios que admiro.',
    'Tu rostro es como febrero, lleno de escarcha, tormentas y nubosidad.'
];

module.exports = {
    checkLVL,
    checkBotFromList,
    helpMenu,
    playSound,
    modCMD,
    meMide,
    setVolumen,
    setCode,
    showCode,
    resetVoice,
    excluir,
    incluir,
    piropoInsulto,
    tts,
    adivina,
    tirarDado,
    talkToLocal,
    rVidas,
    displayHelpMenu,
    sayHello,
    instersections,
    switchCMD,
    isCustomReward,
    displaySonido,
    randomMeme,
    magicNumber,
    alreadyConnected
}