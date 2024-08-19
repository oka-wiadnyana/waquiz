async function mentionEveryone(client, message) {
    const chat = await message.getChat();

    if (chat.isGroup) {
        let text = '';
        let mentions = [];

        for (let participant of chat.participants) {
            mentions.push(`${participant.id.user}@c.us`);
            text += `@${participant.id.user}\n`;
        }

        await chat.sendMessage(text, { mentions });
    }
}

async function getAdmins(client, message) {
    const chat = await message.getChat();

    if (chat.isGroup) {
        let adminList = [];
        let text = 'Group Admins:\n';

        for (let participant of chat.participants) {
            if (participant.isAdmin) {
                adminList.push(`${participant.id.user}@c.us`);
                text += `- @${participant.id.user}\n`;
            }
        }

        await chat.sendMessage(text, { mentions: adminList });
    }
}

module.exports = {
    mentionEveryone,
    getAdmins,
};
