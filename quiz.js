function initializeQuiz(quizzes, adminId, groupId, groupName) {
    const existingQuiz = quizzes.find(quiz => quiz.status !== 'ended' && quiz.group.id === groupId);
    
    if (existingQuiz) return 'A quiz is already active in this group.';

    const quiz = {
        id: Date.now(),
        status: 'initialized',
        group: {
            id: groupId,
            name: groupName,
        },
        participants: [],
        questions: [
            {
                text: 'question',
                correctAnswer: 'answer',
            }
        ],
        currentQuestionIndex: 0,
        questionTimeLimit: 5000,
        admin: adminId,
        startTime: null,
        endTime: null,
    };

    quizzes.push(quiz);

    return `Quiz ID: ${quiz.id} has been initialized by @${adminId} in group ${groupName}`;
}

function addParticipants(quiz, newParticipants) {
    if (quiz.status !== 'initialized') return 'No initialized quiz to add participants.';

    newParticipants.forEach(participant => {
        const existingParticipant = quiz.participants.find(p => p.id === participant.id);

        if (!existingParticipant) {
            quiz.participants.push({
                id: participant.id,
                name: participant.name || participant.pushname,
                phoneNumber: participant.number,
                score: 0,
            });
        }
    });

    return `${newParticipants.length} participants added to the quiz.`;
}

async function startQuiz(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);

    if (!quiz || quiz.status !== 'initialized') return 'No quiz to start.';

    quiz.status = 'started';
    quiz.startTime = new Date();

    await askNextQuestion(quiz);
    
    return `Quiz ${quizId} just started!`;
}

async function askNextQuestion(quiz) {
    if (quiz.currentQuestionIndex >= quiz.questions.length) {
        endQuiz(quiz.id);
        return;
    }

    const question = quiz.questions[quiz.currentQuestionIndex];
    await sendQuestionToGroup(quiz.group.id, question);

    const answerListener = (message) => {
        if (message.from === quiz.group.id && message.body === question.correctAnswer) {
            const correctParticipant = quiz.participants.find(p => p.id._serialized === message.author);
            if (correctParticipant) {
                correctParticipant.score++;
                client.sendMessage(quiz.group.id._serialized, `✔ Correct answer by @${correctParticipant.id.user}`);
                client.removeListener('message_create', answerListener);
            }
        }
    };

    client.on('message_create', answerListener);

    setTimeout(() => {
        client.removeListener('message_create', answerListener);
        quiz.currentQuestionIndex++;
        askNextQuestion(quiz);
    }, quiz.questionTimeLimit);
}

function endQuiz(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);

    if (!quiz) return 'Quiz not found.';

    quiz.status = 'ended';
    quiz.endTime = new Date();

    return printFinalBoard(quiz);
}

function printFinalBoard(quiz) {
    const duration = (quiz.endTime - quiz.startTime) / 1000;
    const participantCount = quiz.participants.length;

    let board = `Quiz Summary\nDate: ${quiz.startTime}\nDuration: ${duration} seconds\nParticipants: ${participantCount}\n\nScores:\n`;

    quiz.participants.forEach(participant => {
        board += `${participant.name}: ${participant.score}\n`;
    });

    return board;
}

async function sendQuestionToGroup(groupId, question) {
    const chat = await client.getChatById(groupId);
    await chat.sendMessage(`Question: ${question.text}`);
}

module.exports = {
    initializeQuiz,
    addParticipants, 
    startQuiz,
    askNextQuestion, 
    endQuiz,
    printFinalBoard,
    sendQuestionToGroup,
};