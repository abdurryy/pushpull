// API module: talks to Open Trivia DB (free, no key) for tie-break questions. Allows 1 request per 5 seconds per player.
const TRIVIA_URL = "https://opentdb.com/api.php";

// Gets one multiple-choice question: { question, category, difficulty, answers, correctAnswer }.
export function getTieBreakQuestion() {
  // url3986 encoding keeps quotes and symbols safe; we decode every text field below.
  const params = new URLSearchParams({ amount: 1, type: "multiple", encode: "url3986" });

  function checkResponseACB(response) {
    if (!response.ok) throw new Error("the trivia service answered " + response.status);
    return response.json();
  }

  function questionACB(data) {
    // response_code 0 means success; 5 means we asked again within 5 seconds.
    if (data.response_code === 5) throw new Error("too many questions at once, wait a few seconds");
    if (data.response_code !== 0) throw new Error("the trivia service returned code " + data.response_code);

    const raw = data.results[0];
    const correctAnswer = decodeURIComponent(raw.correct_answer);
    const answers = raw.incorrect_answers.map(decodeURIComponent);
    // Put the correct answer at a random place among the wrong ones.
    answers.splice(Math.floor(Math.random() * (answers.length + 1)), 0, correctAnswer);

    return {
      question: decodeURIComponent(raw.question),
      category: decodeURIComponent(raw.category),
      difficulty: raw.difficulty,
      answers,
      correctAnswer,
    };
  }

  return fetch(TRIVIA_URL + "?" + params).then(checkResponseACB).then(questionACB);
}
