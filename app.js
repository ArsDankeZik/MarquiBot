require('dotenv').config();
const func = require('./functions');
const tmi = require('tmi.js');
const piropos = require('./functions').piropos;
const insultos = require('./functions').insultos;
const VERSION = '1.3.1';

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
    if(!func.joinSayHi){
        client.say(channel, '¡Ya estoy de vuelta por aquí!');
        func.joinSayHi = true;
        console.log(`El número a adivinar es: ${func.magicNumber}`);
    }
});

client.on('message', (channel, tags, message, self) => {
    if (self) return;
    if(tags.hasOwnProperty('custom-reward-id')) {
        if(tags['custom-reward-id'] == '3eeda0b4-a6f4-4304-b029-8f81631982eb'){
            msg = message.trim();
            if(!msg) client.say(channel, `Te has olvidado de indicar que tipo de sonido reproducir. ${ func.helpMenu(checkLVL(tags), false, 'sonido') }`);
            else func.playSound(`${msg}`);
        }
    }
    if (tags.username.toLowerCase() === 'streamelements') return;
    //Normalize cmd and check if include cmd
    const msgIncludesCMD = (cmd, message) => message.toLowerCase().includes(cmd) ? true : false;
    //Normalize cmd and check if cmd and message match
    const msgIsCMD = (cmd, message) => message.toLowerCase().split(' ')[0] == cmd ? true : false;
    //Restrict perms on user doesn't matter if have vip, sub, mod
    const excludeFromPermissions = (user) => func.EXCEPT_FROM_PERMISSION_LIST.push(user);
    const deleteFromExcludeFromPermissions = (user) => func.EXCEPT_FROM_PERMISSION_LIST = func.EXCEPT_FROM_PERMISSION_LIST.filter(r => r != user);
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

    if(msgIncludesCMD('!modcmd', message) && func.isModWhoCalls(tags)){
        if(msgIncludesCMD('sonido', message)){
            const params = [channel, tags, message, '!modcmd sonido', false, [], client];
            const value = func.cleanCommandListener(params);
            func.playSound(value);
        }
    }

    if(msgIncludesCMD('!hora', message)){
        client.say(channel, `La hora actual en el Reino de España es ${func.hora()}`);
    }

    if(msgIncludesCMD('!donde', message)){
        client.say(channel, `${func.donde()}`);
    }

    if (msgIncludesCMD('!memide', message)) {
        const params = [channel, tags, message, '!memide', false, [], client];
        const value = func.cleanCommandListener(params);
        let memide = tags.username.toLowerCase() != 'noctismaiestatem' ? func.getRandInt(1, 35) : func.getRandInt(15, 35);
        const frase = (cm) => {
            if (cm > 0 && cm <= 13) return `Según la RAE tu pene de ${cm} cm pasa a ser una pena`;
            else if (cm > 13 && cm <= 22) return `Tu pene de ${cm} cm no es para tanto a no ser que sepas usarlo`;
            else if (cm > 22 && cm <= 35) return `Este pene de ${cm} cm está hecho para matar y no para dar placer`;
            else return `No he podido calcular tu pene`;
        }

        client.say(channel, `@${tags.username}: ${frase(memide)}`);
    }

    if (msgIncludesCMD('!volumen', message)) {
        if (func.isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!volumen', true, [], client];
            const value = func.cleanCommandListener(params);

            if (value) func.setVolume(parseFloat(value));
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }

    if(msgIncludesCMD('!setcode', message)){
        if(func.isModWhoCalls(tags)){
            const params = [channel, tags, message, '!setcode', true, [], client];
            const code = func.cleanCommandListener(params);
            
            if(code != true){
                func.codeGame = code;
                client.say(channel, 'El código fue establecido');
            } else client.say(channel, `Esto no tiene sentido para mi`);
        }
    }

    if(msgIncludesCMD('!code', message)){
        if(func.codeGame && func.codeGame.length > 2) {
            const codeGamePrint = func.codeGame.includes('http') ? func.codeGame : func.codeGame.toUpperCase();
            client.say(channel, `El último código que soy capaz de recordar es el ${codeGamePrint}`);
        }
        else client.say(channel, `No me han asignado aún ningún código...`);   
    }

    if(msgIncludesCMD('!cumple', message)) {
        const time = func.alberMarqui();
        const str = !time.includes('0') ? `¡El cumple de nuestro querido streamer es el 26/11, ya solo queda ${func.alberMarqui()}!` : 'El cumple de Marqui ha sido el día 26/11';
        client.say(channel, str);
    }
    if(msgIncludesCMD('!resetvoice', message)){
        if(!func.resetVoiceForUser(tags.username)) client.say(channel, `Has sobrepasado el limite de veces que puedes usar este comando`);
    }

    if (msgIncludesCMD('!excluir', message)) {
        if (func.isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!excluir', true, [], client];
            const username = func.cleanCommandListener(params);
            if (username) excludeFromPermissions(username);
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }

    if (msgIncludesCMD('!incluir', message)) {
        if (func.isModWhoCalls(tags)) {
            const params = [channel, tags, message, '!incluir', true, [], client];
            const username = func.cleanCommandListener(params);
            if (username) deleteFromExcludeFromPermissions(username);
            else console.error(channel, 'User in exclude list, no perms or unexpected error');
        }
    }

    if (msgIncludesCMD('!ttsinsulto', message)) {
        const params = [channel, tags, message, '!ttsinsulto', true, func.EXCEPT_FROM_PERMISSION_LIST, client];
        const value = func.cleanCommandListener(params);

        if (value) {
            func.talkToLocal(tags.username, func.pickRandom(insultos));
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if (msgIncludesCMD('!ttspiropo', message)) {
        const params = [channel, tags, message, '!ttspiropo', true, func.EXCEPT_FROM_PERMISSION_LIST, client];
        const value = func.cleanCommandListener(params);

        if (value) {
            func.talkToLocal(tags.username, func.pickRandom(piropos));
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if (msgIsCMD('!tts', message)) {
        const params = [channel, tags, message, '!tts', true, func.EXCEPT_FROM_PERMISSION_LIST, client];
        const value = func.cleanCommandListener(params);

        if (value) {
            func.talkToLocal(tags.username, value);
        } else console.error(channel, 'User in exclude list, no perms or unexpected error');
    }

    if (message.toLowerCase().includes('!adivina')) {
        msg = message.replace('!adivina', '').trim();
        client.say(channel, `${ func.takeAGuess(msg, tags.username) }`);
    }

    if (msgIncludesCMD('!dado', message)) {
        const params = [channel, tags, message, '!dado', false, [], client];
        let value = func.cleanCommandListener(params);
        if (value == undefined || value == null || value == true) value = 6;
        console.log(value);
        if (!isNaN(value)) {
            client.say(channel, `Has sacado un, ${func.dado(value)}`);
        }
    }

    //@refactor
    if (message.toLowerCase().includes('!rvidas')) {
        msg = message.toLowerCase().replace('!rvidas', '').trim();
        if (tags.badges != null && tags.badges != undefined && (tags.badges.hasOwnProperty('broadcaster') || tags.username == 'noctismaiestatem')) {
            if (!msg || msg.length == 0) client.say(channel, `El comando es !rvidas nombreusuario (sin @)`);
            else func.registerUserAndCount(msg, 'reset');
        }
    }

    if (message.toLowerCase().includes('!help')) {
        msg = message.replace('!help', '').trim();
        msg = msg.replace('!', '');
        menu = msg.length == 0;

        if (menu) client.say(channel, `Escribe !help comando(sustituye comando por el comando que quieras consultar, no me seas borrego) para saber más acerca de un comando. Comandos disponibles: ${func.helpMenu(checkLVL(tags), true, null)}`);
        if (!menu) client.say(channel, `${func.helpMenu(checkLVL(tags), false, msg)}`);
    }

    if(message.toLowerCase().includes('hola')){
        client.say(channel, `Hola a ti también, @${tags.username}`);
    }

    if(intersect(func.RESTRICTED_WORDS, message.toLowerCase().split(' '))) client.say(channel, `Cuidado con lo que dices, @${tags.username}, o dependiendo de la gravedad de tus palabras uno de nuestros queridos mods te puede poner un timeout/ban`);
    if(intersect(['puta', 'furcia', 'zorra', 'guarra', 'maricona', 'malparido'], message.toLowerCase().split(' '))) client.say(channel, `Quizás deberías moderar tu lenguaje estimado/a @${tags.username}`);
    if(intersect(['twitter', 'tw'], message.toLowerCase().split(' '))) client.say(channel, `El twitter de AlberMarqui es https://bit.ly/3Fb6vba`);
    if(intersect(['instagram', 'ig'], message.toLowerCase().split(' '))) client.say(channel, `El instagram de AlberMarqui es https://bit.ly/3ky9kv5`);
    if(intersect(['discord', 'dc'], message.toLowerCase().split(' '))) client.say(channel, `El discord del canal es https://discord.gg/d3xTjTwMXn`);
    if(intersect(['código', 'codigo', 'code'], message.toLowerCase().split(' ')) || intersect(message.toLowerCase().split(' '), ['código', 'codigo', 'code'])) {
        console.log('Me ha parecido que han pedido el código del juego');
        if(!func.codeGame && !func.codeGame.length > 2) console.log('¿Es posible que no haya ningún código establecido?');
        else if(func.codeGame && func.codeGame.length > 2) client.say(channel, `El último código que me han registrado mis amos es ${func.codeGame.toUpperCase()}`);
    }

    switch (message.toLowerCase()) {
        case '!insulto':
            client.say(channel, `${func.pickRandom(insultos)}`);
            break;
        case '!log':
            // hace un sequimiento de los tags del usuario (mod o broadcaster) por consola
            if (func.isModWhoCalls(tags)) {
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
            client.say(channel, `${func.dimeMiRango(tags.username, tags.badges)}`);
            break;
        case '!piropo':
            client.say(channel, `${func.pickRandom(piropos)}`);
            break;
        case '!vidas':
            client.say(channel, `${func.registerUserAndCount(tags.username, 'vidas')}`);
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
                if (func.isModWhoCalls(tags)) console.log(channel, `El número es ${func.magicNumber}`);
            break;
        case '!creador':
            client.say(channel, 'El nombre de mi creador es @noctismaiestatem (twitch.tv/noctismaiestatem)');
            break;
    };
});

    // if (msgIsCMD('!delete', message)) {
    //     if (isModWhoCalls(tags)) {
    //         console.log(tags);
    //         whisperClient.whisper('noctismaiestatem', 'Utilizando el comando !delete');
    //         client.deletemessage(channel, tags.id);
    //     }
    // }