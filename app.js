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

client.on('disconnected', () => {
    console.log('Client disconnected. Attempting to restart...');
    client.initialize();
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

    if (typeof message.body === 'string' && message.body.startsWith('!add')) {
        const chat = await message.getChat();
        const quiz = quizzes.find(q => q.group.id.user === chat.id.user);
        
        if (!quiz) {
            await message.reply('No quiz initialized in this group.');
            return;
        }

        const newParticipants = await Promise.all(
            message.mentionedIds.map(async (id) => {
                const contact = await client.getContactById(id);
                return contact;
            })
        );

        const response = addParticipants(quiz, newParticipants);
        await chat.sendMessage(response);
    }

    if (message.body === '!start') {
        const chat = await message.getChat();
        const quiz = quizzes.find(q => q.group.id.user === chat.id.user);

        if (!quiz) {
            await message.reply('No quiz initialized in this group.');
            return;
        }
        
        const response = startQuiz(client, quiz);
        await chat.sendMessage(response);
    }
});