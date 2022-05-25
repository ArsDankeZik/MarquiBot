require('dotenv').config();
const func = require('./functions');
const tmi = require('tmi.js');
const tts = require('./tts').tts_service;

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
    if(!func.alreadyConnected) {
        client.say(channel, '¡Ya estoy de vuelta por aquí!');
        console.log(`El número a adivinar es: ${ func.magicNumber }`);
        func.alreadyConnected = true;
    }
});

client.on('message', (channel, tags, message, self) => {
    const _this = [client, channel, message, tags];
    if (self) return;
    if(func.isCustomReward(tags)) {
        if(tags['custom-reward-id'] == '3eeda0b4-a6f4-4304-b029-8f81631982eb'){
            msg = message.trim();
            if(!msg) client.say(channel, `Te has olvidado de indicar que tipo de sonido reproducir. ${ func.helpMenu(checkLVL(tags), false, 'sonido') }`);
            else func.playSound(`${msg}`);
        }
    }

    // Comprueba que el que habla no es un bot de la lista establecida
    if(func.checkBotFromList(tags.username.toLowerCase())) return;
    // Acciona comandos en modo Moderador para no canjearlo a través de puntos del canal
    func.modCMD(_this);
    // !memide
    func.meMide(_this);
    // Establece el volumen del *tts*
    func.setVolumen(_this);
    // Establece el códico del "juego" actual
    func.setCode(_this);
    // Muestra el código actual
    func.showCode(_this);
    // Resetea la voz del usuario
    func.resetVoice(_this);
    // Incluir y excluir de los permisos al usuario
    func.excluir(_this);
    func.incluir(_this);
    // Piropear o insultar a través de tts
    func.piropoInsulto(_this);
    // Reproduce el mensaje en el caso de que el usuario tenga permisos
    func.tts(_this);
    // Adivina el número
    func.adivina(_this);
    // Saca un dado al azar
    func.tirarDado(_this);
    // Restablece las vidas del usuario indicado
    func.rVidas(_this)
    // Enseña el menú de ayuda al usuario
    func.displayHelpMenu(_this);
    // Saluda a los nuevos usuarios del chat cuando dicen hola
    func.sayHello(_this);
    // Función a la escucha de ciertas palabras que activan ciertas funciones del bot
    func.instersections(_this);
    // Evalua qué comando está siendo llamado
    func.switchCMD(_this);
});

// Calling tts-service
tts();