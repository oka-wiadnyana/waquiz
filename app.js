const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    headless: true,
    args: [
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--no-sandbox",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
  },
});

let quizzes = {}; // Menyimpan status kuis per grup
const totalTimePerQuestion = 30; // Waktu per pertanyaan (30 detik)

// Daftar pertanyaan
let questions = [];
// const questions = [
//   {
//     question:
//       "1. Apa singkatan dari CPNS?\nA) Calon Pegawai Negara Sipil\nB) Calon Pegawai Negeri Sipil\nC) Calon Pegawai Nasional Sipil\nD) Calon Pelayan Negeri Sipil",
//     answer: "B",
//   },
//   {
//     question:
//       "2. Apa lambang negara Indonesia?\nA) Komodo\nB) Garuda\nC) Elang\nD) Kijang",
//     answer: "B",
//   },
//   // Tambahkan lebih banyak pertanyaan sesuai kebutuhan
// ];

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
  console.log("Scan QR code untuk login ke WhatsApp.");
});

client.on("message", async (message) => {
  const chatId = message.from;
  const senderId = message.author || message.from; // Gunakan `author` jika pesan dari grup
  const senderName = message._data.notifyName || senderId.split("@")[0]; // Ambil nama pengguna

  if (message.body.toLowerCase() === "mulai quiz") {
    await client.sendMessage(
      chatId,
      "Silahkan pilih jenis quiz :\n1. Manajerial (ketik 'quiz manajerial')\n2. Kepemimpinan (ketik 'quiz kepemimpinan')"
    );

    return;
  }

  if (message.body.toLowerCase().startsWith("quiz")) {
    let jenisQuiz = message.body.toLowerCase().split(" ")[1];
    // Tambah kata kunci disini, sesuaikan dengan nama file pertanyaan
    if (jenisQuiz === "manajerial") {
      questions = JSON.parse(fs.readFileSync("./manajerial.txt", "utf8"));
    } else if (jenisQuiz === "kepemimpinan") {
      questions = JSON.parse(fs.readFileSync("./kepemimpinan.txt", "utf8"));
    }
    if (!quizzes[chatId]) {
      quizzes[chatId] = {
        participants: {},
        currentQuestion: 0,
        timer: null,
        isQuizActive: true,
        questions,
      };
      await client.sendMessage(
        chatId,
        "Quiz dimulai! Berikut pertanyaan pertama:"
      );
      sendQuestion(chatId);
    }
    return;
  }

  if (message.body.toLowerCase() === "stop quiz") {
    if (quizzes[chatId]) {
      clearTimeout(quizzes[chatId].timer);
      delete quizzes[chatId];
      await client.sendMessage(
        chatId,
        "Quiz dihentikan. Silahkan ketik 'mulai quiz' untuk memulai kembali."
      );
    }
    return;
  }

  if (quizzes[chatId] && quizzes[chatId].isQuizActive) {
    const quiz = quizzes[chatId];

    if (!quiz.participants[senderId]) {
      quiz.participants[senderId] = {
        name: senderName,
        correct: 0,
        incorrect: 0,
        correctQuestions: [],
        wrongQuestions: [],
      };
    }
    const participant = quiz.participants[senderId];

    const currentIndex = quiz.currentQuestion;
    const correctAnswer = quiz.questions[currentIndex].answer;

    if (["A", "B", "C", "D", "E"].includes(message.body.toUpperCase())) {
      if (
        participant.correctQuestions.includes(currentIndex + 1) ||
        participant.wrongQuestions.includes(currentIndex + 1)
      ) {
        await client.sendMessage(
          chatId,
          `Anda sudah menjawab pertanyaan ${currentIndex + 1}.`
        );
        return;
      }
      if (message.body.toUpperCase() === correctAnswer) {
        participant.correct++;
        participant.correctQuestions.push(currentIndex + 1);
        await client.sendMessage(chatId, `${senderName}, benar! ✅`);
      } else {
        participant.incorrect++;
        participant.wrongQuestions.push(currentIndex + 1);
        await client.sendMessage(
          chatId,
          `${senderName}, salah ❌. Jawaban yang benar: ${correctAnswer}`
        );
      }
    } else {
      await client.sendMessage(chatId, "Jawaban anda tidak ada dalam pilihan");
      return;
    }
  }
});

function sendQuestion(chatId) {
  const quiz = quizzes[chatId];

  if (quiz.currentQuestion < quiz.questions.length) {
    const question = quiz.questions[quiz.currentQuestion].question;
    client.sendMessage(chatId, question);

    quiz.timer = setTimeout(async () => {
      await client.sendMessage(
        chatId,
        `Waktu habis untuk pertanyaan ${quiz.currentQuestion + 1}.`
      );
      quiz.currentQuestion++;
      sendQuestion(chatId); // Lanjut ke pertanyaan berikutnya
    }, totalTimePerQuestion * 1000);
  } else {
    // Quiz selesai, kirimkan skor
    sendScores(chatId);
  }
}

function sendScores(chatId) {
  const quiz = quizzes[chatId];
  let scoreMessage = "Quiz selesai! Berikut skor peserta:\n";
  Object.values(quiz.participants).forEach((p) => {
    scoreMessage += `\n${p.name}:\n  - Benar: ${p.correct} (${
      p.correctQuestions.join(", ") || "Tidak ada"
    })\n  - Salah: ${p.incorrect} (${
      p.wrongQuestions.join(", ") || "Tidak ada"
    })\n *Skor* : ${(p.correct / questions.length) * 100}%
    `;
  });
  client.sendMessage(chatId, scoreMessage);
  delete quizzes[chatId];
}

client.on("ready", () => {
  console.log("WhatsApp bot siap!");
});

client.initialize();
