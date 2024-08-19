function initQuiz(adminId) {
    if (quiz && quiz.status !== 'ended') {
        return 'A quiz is already active!';
    }

    quiz = {
        id: Date.now(),
        status: 'initialized',
        participants: {},
        questions: [],
        currentQuestionIndex: 0,
        scores: {},
        admin: adminId,
        startTime: null,
        endTime: null,
    };

    return 'Quiz initialized!';
}

