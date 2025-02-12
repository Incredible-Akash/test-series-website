let questions = [];
let currentQuestionIndex = 0;
let score = 0;

document.getElementById("pdf-upload").addEventListener("change", handleFileUpload);
document.getElementById("submit-btn").addEventListener("click", submitAnswer);
document.getElementById("next-btn").addEventListener("click", nextQuestion);
document.getElementById("restart-btn").addEventListener("click", restartTest);

function handleFileUpload(event) {
    const file = event.target.files[0];

    if (file && file.type === "application/pdf") {
        const reader = new FileReader();
        reader.onload = function(e) {
            const pdfData = new Uint8Array(e.target.result);
            extractPDFContent(pdfData);
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert("Please upload a valid PDF file.");
    }
}

function extractPDFContent(pdfData) {
    pdfjsLib.getDocument(pdfData).promise.then(function(pdf) {
        let allText = '';
        let numPages = pdf.numPages;

        // Extract text from each page
        for (let i = 1; i <= numPages; i++) {
            pdf.getPage(i).then(function(page) {
                page.getTextContent().then(function(textContent) {
                    allText += textContent.items.map(item => item.str).join(' ') + ' ';
                    
                    // Once all pages are processed, start generating questions
                    if (i === numPages) {
                        processExtractedText(allText);
                    }
                });
            });
        }
    });
}

function processExtractedText(text) {
    // Basic split logic assuming a consistent format: Question => Options => Correct Answer
    const questionBlocks = text.split("\n"); // You may need more advanced parsing logic for complex PDFs
    
    questions = questionBlocks.map(block => {
        const lines = block.split("\n").map(line => line.trim()).filter(Boolean);
        
        if (lines.length >= 3) {
            const question = lines[0];
            const options = lines.slice(1, -1); // Options are everything between question and answer
            const correctAnswer = lines[lines.length - 1]; // Correct answer is the last line
            return { question, options, correctAnswer };
        }
        return null;
    }).filter(Boolean);

    // Hide the upload section and show the test
    document.getElementById("upload-container").classList.add("hidden");
    document.getElementById("test-container").classList.remove("hidden");

    // Load the first question
    loadQuestion();
}

function loadQuestion() {
    const question = questions[currentQuestionIndex];

    document.getElementById("question-title").textContent = `Question ${currentQuestionIndex + 1}`;
    document.getElementById("question").textContent = question.question;

    const form = document.getElementById("answers-form");
    form.innerHTML = ''; // Clear previous options

    question.options.forEach((option, index) => {
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "answer";
        input.value = option;
        input.id = `answer${index + 1}`;

        const label = document.createElement("label");
        label.setAttribute("for", `answer${index + 1}`);
        label.textContent = option;

        form.appendChild(input);
        form.appendChild(label);
        form.appendChild(document.createElement("br"));
    });

    document.getElementById("feedback").classList.add("hidden");
    document.getElementById("next-btn").classList.add("hidden");
    document.getElementById("submit-btn").classList.remove("hidden");
}

function submitAnswer() {
    const selectedAnswer = document.querySelector('input[name="answer"]:checked');

    if (!selectedAnswer) {
        alert("Please select an answer.");
        return;
    }

    const correctAnswer = questions[currentQuestionIndex].correctAnswer;
    const feedback = document.getElementById("feedback");
    const nextButton = document.getElementById("next-btn");

    if (selectedAnswer.value === correctAnswer) {
        score++;
        feedback.textContent = "Correct!";
        feedback.style.color = "green";
    } else {
        feedback.textContent = `Incorrect! The correct answer is ${correctAnswer}.`;
        feedback.style.color = "red";
    }

    feedback.classList.remove("hidden");
    nextButton.classList.remove("hidden");
    document.getElementById("submit-btn").classList.add("hidden");
}

function nextQuestion() {
    currentQuestionIndex++;

    if (currentQuestionIndex < questions.length) {
        loadQuestion();
        document.getElementById("submit-btn").classList.remove("hidden");
        document.getElementById("next-btn").classList.add("hidden");
    } else {
        showResults();
    }
}

function showResults() {
    document.getElementById("test-container").classList.add("hidden");
    document.getElementById("result").classList.remove("hidden");
    document.getElementById("score").textContent = `You scored ${score} out of ${questions.length}`;
}

function restartTest() {
    currentQuestionIndex = 0;
    score = 0;
    document.getElementById("result").classList.add("hidden");
    loadQuestion();
    document.getElementById("submit-btn").classList.remove("hidden");
}
