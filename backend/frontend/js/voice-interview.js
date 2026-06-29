
var token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/static/html/login.html";
}

// Speech Recognition
var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
var recognition = null;
var isRecording = false;
var currentQuestionNumber = 0;
var TOTAL_QUESTIONS = 10;
var sessionResults = [];
var currentQuestion = "";
var currentQuestionType = "";
var sessionAppId = null;

function authHeaders() {
    return { Authorization: "Bearer " + token };
}

function getElement(id) {
    return document.getElementById(id);
}

// Load applications into dropdown
function loadApplications() {
    fetch(API_BASE + "/applications", {
        headers: authHeaders()
    })
    .then(function(response) {
        if (!response.ok) throw new Error("Failed to load applications");
        return response.json();
    })
    .then(function(apps) {
        var select = getElement("appSelect");
        if (!select) return;
        select.innerHTML = '<option value="">-- Select an application --</option>';
        
        if (!apps || apps.length === 0) {
            var opt = document.createElement("option");
            opt.value = "";
            opt.textContent = "No applications found. Create one first.";
            opt.disabled = true;
            select.appendChild(opt);
            var msg = getElement("setupMessage");
            if (msg) { msg.textContent = "You need to create an application first."; msg.style.color = "crimson"; }
            return;
        }
        
        for (var i = 0; i < apps.length; i++) {
            var app = apps[i];
            var opt = document.createElement("option");
            opt.value = app.id;
            opt.textContent = app.job_title + " @ " + app.company_name;
            select.appendChild(opt);
        }
    })
    .catch(function(err) {
        console.error("Failed to load applications:", err);
        var msg = getElement("setupMessage");
        if (msg) { msg.textContent = "Failed to load applications. Make sure server is running."; msg.style.color = "crimson"; }
    });
}

// GLOBAL: Start interview session - called from onclick in HTML
function startSession() {
    var appId = getElement("appSelect") ? getElement("appSelect").value : "";
    
    if (!appId) {
        var msg = getElement("setupMessage");
        if (msg) { msg.textContent = "Please select an application."; msg.style.color = "crimson"; }
        return false;
    }
    
    sessionAppId = appId;
    sessionResults = [];
    currentQuestionNumber = 0;
    
    var setup = getElement("setupSection");
    var interview = getElement("interviewSection");
    var feedback = getElement("feedbackSection");
    var complete = getElement("completeSection");
    if (setup) setup.style.display = "none";
    if (interview) interview.style.display = "block";
    if (feedback) feedback.style.display = "none";
    if (complete) complete.style.display = "none";
    
    getNextQuestion();
    return false;
}

function getNextQuestion() {
    if (currentQuestionNumber >= TOTAL_QUESTIONS) {
        completeSession();
        return;
    }
    
    currentQuestionNumber++;
    var counter = getElement("questionCounter");
    if (counter) counter.textContent = "Question " + currentQuestionNumber + " of " + TOTAL_QUESTIONS;
    
    fetch(API_BASE + "/voice-interview/generate-question", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify({
            application_id: parseInt(sessionAppId),
            difficulty: getElement("difficultySelect") ? getElement("difficultySelect").value : "moderate"
        })
    })
    .then(function(response) {
        if (!response.ok) { return response.text().then(function(t) { throw new Error(t); }); }
        return response.json();
    })
    .then(function(data) {
        currentQuestion = data.question;
        currentQuestionType = data.type;
        
        var qt = getElement("questionText");
        if (qt) qt.textContent = data.question;
        var qtype = getElement("questionType");
        if (qtype) qtype.textContent = data.type;
        var qtips = getElement("questionTips");
        if (qtips) qtips.textContent = "💡 " + data.tips;
        var answer = getElement("answerInput");
        if (answer) answer.value = "";
        var feedback = getElement("feedbackSection");
        if (feedback) feedback.style.display = "none";
        
        var submitBtn = getElement("submitAnswerBtn");
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "📊 Submit for Evaluation"; }
        var nextBtn = getElement("nextQuestionBtn");
        if (nextBtn) nextBtn.disabled = true;
        
        speakText(data.question);
    })
    .catch(function(err) {
        console.error("Failed to generate question:", err);
        alert("Failed to generate question: " + err.message);
    });
}

// GLOBAL: Start recording - called from onclick in HTML
function startRecording() {
    if (!SpeechRecognition) {
        alert("Speech recognition is not supported in this browser.");
        return false;
    }
    
    if (!recognition) {
        try {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";
            
            recognition.onresult = function(event) {
                var transcript = "";
                for (var i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                var answer = getElement("answerInput");
                if (answer) answer.value = transcript;
            };
            
            recognition.onerror = function(event) {
                console.error("Speech recognition error:", event.error);
                var status = getElement("recordingStatus");
                if (status) status.textContent = "Error: " + event.error;
                stopRecording();
            };
            
            recognition.onend = function() {
                if (isRecording) {
                    try { recognition.start(); } catch(e) {}
                }
            };
        } catch(e) {
            console.error("Failed to setup speech recognition:", e);
            return false;
        }
    }
    
    try {
        recognition.start();
        isRecording = true;
        var startBtn = getElement("startRecordingBtn");
        var stopBtn = getElement("stopRecordingBtn");
        var status = getElement("recordingStatus");
        if (startBtn) startBtn.style.display = "none";
        if (stopBtn) stopBtn.style.display = "inline-block";
        if (status) { status.textContent = "🔴 Recording..."; status.className = "recording-status recording"; }
    } catch (err) {
        console.error("Failed to start recording:", err);
    }
    return false;
}

// GLOBAL: Stop recording - called from onclick in HTML
function stopRecording() {
    if (recognition) {
        try { recognition.stop(); } catch(e) {}
    }
    isRecording = false;
    var startBtn = getElement("startRecordingBtn");
    var stopBtn = getElement("stopRecordingBtn");
    var status = getElement("recordingStatus");
    if (startBtn) startBtn.style.display = "inline-block";
    if (stopBtn) stopBtn.style.display = "none";
    if (status) { status.textContent = "✅ Stopped"; status.className = "recording-status"; }
    return false;
}

// Text-to-speech
function speakText(text) {
    if (!window.speechSynthesis) return;
    try {
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        window.speechSynthesis.speak(utterance);
    } catch(e) {
        console.error("Speech synthesis error:", e);
    }
}

// GLOBAL: Submit answer for evaluation - called from onclick in HTML
function submitAnswer() {
    var answer = getElement("answerInput");
    var answerText = answer ? answer.value.trim() : "";
    
    if (!answerText) {
        showFeedback("—", "⚠️ Please provide an answer (speak or type) before submitting.", [], [], "");
        return false;
    }
    
    var btn = getElement("submitAnswerBtn");
    if (btn) { btn.disabled = true; btn.textContent = "⏳ Evaluating..."; }
    
    fetch(API_BASE + "/voice-interview/evaluate-answer", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token
        },
        body: JSON.stringify({
            question: currentQuestion,
            candidate_answer: answerText,
            application_id: parseInt(sessionAppId)
        })
    })
    .then(function(response) {
        if (!response.ok) { return response.text().then(function(t) { throw new Error(t); }); }
        return response.json();
    })
    .then(function(data) {
        // Store result
        sessionResults.push({
            question: currentQuestion,
            answer: answerText,
            score: data.score,
            feedback: data.feedback,
            strengths: data.strengths || [],
            weaknesses: data.weaknesses || [],
            modelAnswer: data.model_answer
        });
        
        // Display feedback
        showFeedback(
            data.score,
            data.feedback,
            data.strengths || [],
            data.weaknesses || [],
            data.model_answer || "No model answer available."
        );
        
        if (btn) { btn.textContent = "✅ Submitted"; btn.disabled = true; }
        var nextBtn = getElement("nextQuestionBtn");
        if (nextBtn) nextBtn.disabled = false;
    })
    .catch(function(err) {
        console.error("Evaluation failed:", err);
        showFeedback("⚠️", "❌ Evaluation failed: " + err.message + ". Please try again.", [], [], "");
        if (btn) { btn.disabled = false; btn.textContent = "📊 Submit for Evaluation"; }
        var nextBtn = getElement("nextQuestionBtn");
        if (nextBtn) nextBtn.disabled = false;
    });
    return false;
}

function showFeedback(score, feedbackText, strengths, weaknesses, modelAnswer) {
    var feedSection = getElement("feedbackSection");
    if (feedSection) feedSection.style.display = "block";
    
    var scoreEl = getElement("scoreDisplay");
    if (scoreEl) {
        scoreEl.textContent = score;
        if (typeof score === "number") {
            scoreEl.className = "score-circle " + (score >= 70 ? "high" : score >= 40 ? "medium" : "low");
        } else {
            scoreEl.className = "score-circle low";
        }
    }
    
    var ft = getElement("feedbackText");
    if (ft) ft.textContent = feedbackText;
    
    var sl = getElement("strengthsList");
    if (sl) {
        sl.innerHTML = "";
        for (var i = 0; i < strengths.length; i++) {
            var li = document.createElement("li");
            li.textContent = strengths[i];
            sl.appendChild(li);
        }
    }
    
    var wl = getElement("weaknessesList");
    if (wl) {
        wl.innerHTML = "";
        for (var i = 0; i < weaknesses.length; i++) {
            var li = document.createElement("li");
            li.textContent = weaknesses[i];
            wl.appendChild(li);
        }
    }
    
    var ma = getElement("modelAnswer");
    if (ma) ma.textContent = modelAnswer;
}

// GLOBAL: Next question - called from onclick in HTML
function nextQuestion() {
    var submitBtn = getElement("submitAnswerBtn");
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = "📊 Submit for Evaluation"; }
    var feedSection = getElement("feedbackSection");
    if (feedSection) feedSection.style.display = "none";
    getNextQuestion();
    return false;
}

function completeSession() {
    var interview = getElement("interviewSection");
    var complete = getElement("completeSection");
    if (interview) interview.style.display = "none";
    if (complete) complete.style.display = "block";
    
    var avgScore = sessionResults.length > 0
        ? Math.round(sessionResults.reduce(function(sum, r) { return sum + r.score; }, 0) / sessionResults.length)
        : 0;
    
    var summary = getElement("sessionSummary");
    if (summary) {
        var html = '<div class="summary-stats">' +
            '<div class="stat-card"><h3>' + sessionResults.length + '</h3><p>Questions Answered</p></div>' +
            '<div class="stat-card"><h3>' + avgScore + '/100</h3><p>Average Score</p></div>' +
            '<div class="stat-card"><h3>' + sessionResults.filter(function(r) { return r.score >= 70; }).length + '</h3><p>Good Answers (≥70)</p></div>' +
            '</div><h3>Question Breakdown</h3>';
        for (var i = 0; i < sessionResults.length; i++) {
            var r = sessionResults[i];
            html += '<div class="result-item">' +
                '<p><strong>Q' + (i+1) + ':</strong> ' + r.question + '</p>' +
                '<p><strong>Score:</strong> ' + r.score + '/100</p>' +
                '<p><strong>Feedback:</strong> ' + r.feedback + '</p></div>';
        }
        summary.innerHTML = html;
    }
}

// GLOBAL: Reset session - called from onclick in HTML
function resetSession() {
    currentQuestionNumber = 0;
    sessionResults = [];
    var complete = getElement("completeSection");
    var setup = getElement("setupSection");
    if (complete) complete.style.display = "none";
    if (setup) setup.style.display = "block";
    return false;
}

// GLOBAL: Logout - called from onclick in HTML
function doLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("application_id");
    localStorage.removeItem("draft_id");
    window.location.href = "/static/html/login.html";
    return false;
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", function() {
    loadApplications();
    console.log("Voice Interview JS v4 initialized");
});