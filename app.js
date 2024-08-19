const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { mentionEveryone, getAdmins } = require('./commands')

const client = new Client({
    authStrategy: new LocalAuth()
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.initialize();

client.on('message_create', async message => {
    if (message.body === '!everyone') {
        await mentionEveryone(client, message);
    }

    if (message.body === '!getAdmins') {
        await getAdmins(client, message);
    }
});