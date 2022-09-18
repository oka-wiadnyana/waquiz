/* Initialize Whatsapp bot */

const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth(),
});

client.initialize();

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});

client.on('ready', () => {
    console.log('Client is ready!');
});


/* Bot code*/

let admin = null;

let isActive = false;

let isClosed = false;

let quizParticipants = [];

let theme = '';

let themified = false;

let hasAdded = false;

let flag = 0;

let quizBoard = `*⚜️ QUIZZ Sekai no Geek ⚜️*\n\nTheme: *${theme}*\n\nParticipants:\n`;

let themify = (theme) => {
    return `*⚜️ QUIZZ Sekai no Geek ⚜️*\n\nTheme: *${theme}*\n\nParticipants:\n`;
}

let newNum = (number) => {
    number = number.toString();
    return number
        .replace(/0/g, '0️⃣')
        .replace(/1/g, '1️⃣')
        .replace(/2/g, '2️⃣')
        .replace(/3/g, '3️⃣')
        .replace(/4/g, '4️⃣')
        .replace(/5/g, '5️⃣')
        .replace(/6/g, '6️⃣')
        .replace(/7/g, '7️⃣')
        .replace(/8/g, '8️⃣')
        .replace(/9/g, '9️⃣');
};

client.on('message_create', async (message) => {
    let contact  = await message.getContact();
    let chat = await message.getChat();








    if (message.body === '!everyone') {
        if (chat.isGroup) {   
            let text = '';
            let mentions = [];
            
            let grant = false;
            let temp = await message.getContact();

            for (let part of chat.participants) {
                if (JSON.stringify(part.id) === JSON.stringify(temp.id) && part.isAdmin) {
                    grant = true;
                    break;
                }
            }

            if (grant === true) {
                for (let participant of chat.participants) {
                    const contact = await client.getContactById(participant.id._serialized);
                
                    mentions.push(contact);
                    text += `@${participant.id.user}\n`;
                }
                
                await chat.sendMessage(text, { mentions });
            }
        }
    }









    if (message.body === '!quiz initiate') {
        if (isActive) {
            message.reply(`❌ A quiz has already been initiated. ❌`);
            return;
        }

        if (isActive && contact.id.user != admin) {
            message.reply(`❌ You are not the quiz admin. ❌`);
            return;
        }

        admin = contact.id.user;
        isActive = true;
        message.reply(`*Quiz initiated ✔️*\n*Quiz admin: @${contact.id.user}*\n`, '', { mentions: [contact] });
    }







    if (message.body === '!quiz terminate') {
        if (!isActive) {
            message.reply(`❌ No quiz has been initiated. ❌`);
            return;
        }

        if (contact.id.user != admin) {
            message.reply(`❌ You are not the quiz admin. ❌`);
            return;
        }

        admin = null;
        isActive = false;
        isClosed = false;
        quizParticipants = [];
        theme = '';
        quizBoard = `*⚜️ QUIZZ Sekai no Geek ⚜️*\n\nTheme: *${theme}*\n\nParticipants:\n`;
        message.reply(`Quiz terminated ✔️`);
    }
    








    if (message.body.includes('!theme')) {
        if (!isActive) {
            message.reply(`❌ No quiz has been initiated. ❌`);
            return;
        }

        if (contact.id.user != admin) {
            message.reply(`❌ You are not the quiz admin. ❌`);
            return;
        }

        if (isClosed) {
            message.reply(`❌ Quiz already started. ❌`);
            return;
        }

        
        theme = message.body.replace('!theme ', '');
        quizBoard = themify(theme);
        themified = true;

        await chat.sendMessage(`Theme: *${theme}*`);
    }








    if (message.body.includes('!add')) {
        if (!isActive) {
            message.reply(`❌ No quiz has been initiated. ❌`);
            return;
        }

        if (contact.id.user != admin) {
            message.reply(`❌ You are not the quiz admin. ❌`);
            return;
        }

        if (isClosed) {
            message.reply(`❌ You can no longer add a participant. ❌`);
            return;
        }

        if (!themified) {
            message.reply(`❌ Choose a theme first. ❌`);
            return;
        }

        let newParticipants = await message.getMentions();

        quizParticipants = quizParticipants.concat(newParticipants);

        for (let participant of newParticipants) {
            participant['score'] = 0;
            quizBoard += `\n@${participant.id.user} ${newNum(participant.score)}`;
        }

        hasAdded = true;

        await chat.sendMessage(quizBoard, { mentions: quizParticipants });
    }










    if (message.body === '!quiz start') {
        if (!isActive) {
            message.reply(`❌ No quiz has been initiated. ❌`);
            return;
        }

        if (contact.id.user != admin) {
            message.reply(`❌ You are not the quiz admin. ❌`);
            return;
        }

        if (!themified || !hasAdded) {
            message.reply(`❌ Please make sure you enter a theme and add at least one participant. ❌`);
            return;
        }

        chat.sendMessage('Quiz started!');

        isClosed = true;
    }








    if (message.body === '✅') {
        if (!isActive) {
            message.reply(`❌ No quiz has been initiated. ❌`);
            return;
        }

        if (contact.id.user != admin) {
            message.reply(`❌ You are not the quiz admin. ❌`);
            return;
        }

        let msg = await message.getQuotedMessage();
        let contact = await msg.getContact();

        for (let participant of quizParticipants) {
            if (JSON.stringify(participant.id) === JSON.stringify(contact.id)) {
                quizBoard = quizBoard.split('\n');
                for (let i in quizBoard) {
                    if (quizBoard[i] === `@${participant.number} ${newNum(participant.score)}`) {
                        participant.score += 1
                        quizBoard[i] = `@${participant.number} ${newNum(participant.score)}`;
                    }
                }
                quizBoard = quizBoard.join('\n');
            }
        }
    }









    if (message.body === '!board') {
        if (!isActive) {
            message.reply(`❌ No quiz has been initiated. ❌`);
            return;
        }

        if (isActive && contact.id.user != admin) {
            message.reply(`❌ You are not the quiz admin. ❌`);
            return;
        }

        await chat.sendMessage(quizBoard, { mentions: quizParticipants });
    }








    // if (message.body.includes('!ban')) {
        
    // }
});

// client.on('group_join', async (notification) => {
//     const contact = await notification.getContact()
//     const chat = await notification.getChat();
    
//     chat.sendMessage(`Bienvenue @${contact.id.user}`, { mentions: [contact] });

//     console.log(chat);
// });