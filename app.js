const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { mentionEveryone, getAdmins } = require('./commands')
const { initializeQuiz, addParticipants, startQuiz, askNextQuestion, endQuiz, printFinalBoard, sendQuestionToGroup } = require('./quiz');

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

let quizzes = [];

client.on('message_create', async message => {
    if (message.body === '!everyone') {
        await mentionEveryone(client, message);
    }

    if (message.body === '!getAdmins') {
        await getAdmins(client, message);
    }

    if (message.body === '!init') {
        const chat = await message.getChat();
        const adminId = message.author.split('@')[0];
        const groupId = chat.id;
        const groupName = chat.name;

        const response = initializeQuiz(quizzes, adminId, groupId, groupName);
        await chat.sendMessage(response);
    }
});