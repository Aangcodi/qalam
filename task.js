(function () {
    "use strict";

    const I = window.QalamI18n;
    const params = new URLSearchParams(location.search);
    const taskId = params.get("id");

    let task = null;
    let session = null;
    let index = 0;
    let answers = [];
    let locked = false;
    let stats = null;

    const QUESTIONS_PER_RUN = 20;

    /* =========================================================
       SEEN
       ========================================================= */

    function getSeen(id) {
        try { return JSON.parse(localStorage.getItem("qalam_seen_" + id) || "[]"); }
        catch (e) { return []; }
    }
    function addSeen(id, ids) {
        const set = new Set(getSeen(id));
        (ids || []).forEach((q) => set.add(q));
        localStorage.setItem("qalam_seen_" + id, JSON.stringify([...set]));
    }
    function resetSeen(id) {
        localStorage.removeItem("qalam_seen_" + id);
    }

    /* =========================================================
       INIT
       ========================================================= */

    document.addEventListener("DOMContentLoaded", () => {
        if (!taskId) { location.href = "index.html"; return; }
        load();
    });

    document.addEventListener("qalam:lang", () => {
        if (task && index < task.questions.length) {
            render();
        } else if (task && stats && stats.exhausted) {
            renderExhausted();
        }
    });

    async function load() {
        const page = document.getElementById("taskPage");
        try {
            const seen = getSeen(taskId);
            task = await window.QalamAPI.getTask(taskId, seen.join(","), QUESTIONS_PER_RUN);
            session = task.session;
            stats = task.stats;

            if (stats && stats.exhausted) { renderExhausted(); return; }

            answers = new Array(task.questions.length).fill(null);
            render();
        } catch (err) {
            page.innerHTML =
                '<p class="task-topbar__meta" style="text-align:center;padding:40px 0;">' + esc(err.message) + '</p>' +
                '<div style="text-align:center;"><a href="index.html" class="btn btn-primary">' + I.t("toMain") + '</a></div>';
        }
    }

    /* =========================================================
       RENDER
       ========================================================= */

    function renderTopbar() {
        const progressInfo = stats ? I.t("seenN", { seen: stats.seen, total: stats.total }) : "";
        return '<div class="task-topbar">' +
            '<a href="index.html" class="task-topbar__back">←</a>' +
            '<div class="task-topbar__info">' +
                '<div class="task-topbar__title">' + esc(task.title) + '</div>' +
                '<div class="task-topbar__meta">' +
                    I.t("questionN", { n: index + 1, total: task.questions.length }) +
                    (progressInfo ? ' · ' + progressInfo : '') +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function render() {
        if (index >= task.questions.length) { submit(); return; }
        locked = false;

        const q = task.questions[index];
        const pct = Math.round(index / task.questions.length * 100);

        const page = document.getElementById("taskPage");
        page.innerHTML =
            renderTopbar() +
            '<div class="progress-strip"><div class="progress-strip__fill" style="width:' + pct + '%"></div></div>' +
            '<div id="qArea"></div>';

        const area = document.getElementById("qArea");
        if (task.type === "letters")     renderLetters(q, area);
        else if (task.type === "swipe")  renderSwipe(q, area);
        else                             renderChoice(q, area);
    }

    /* =========================================================
       CHOICE
       ========================================================= */

    function renderChoice(q, area) {
        const card = document.createElement("div");
        card.className = "q-card";
        card.innerHTML = '<div class="q-prompt">' + esc(q.prompt) + '</div>' +
            '<div class="q-options" id="qOptions"></div>';
        area.appendChild(card);

        const box = card.querySelector("#qOptions");
        const letters = ["A", "B", "C", "D", "E", "F"];

        q.options.forEach((opt, i) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "opt";
            btn.innerHTML =
                '<span class="opt__letter">' + (letters[i] || (i + 1)) + '</span>' +
                '<span>' + esc(opt) + '</span>';
            btn.addEventListener("click", () => {
                if (locked) return;
                locked = true;
                answers[index] = i;
                box.querySelectorAll(".opt").forEach((b) => { b.disabled = true; });
                btn.classList.add("correct");
                playOk();
                setTimeout(nextQuestion, 400);
            });
            box.appendChild(btn);
        });
    }

    /* =========================================================
       LETTERS
       ========================================================= */

    function renderLetters(q, area) {
        const card = document.createElement("div");
        card.className = "q-card";
        card.innerHTML =
            '<div class="q-label">' + I.t("writeWord") + '</div>' +
            '<div class="q-prompt">' + esc(q.prompt) + '</div>' +
            '<div class="field" style="margin-top:20px;">' +
                '<input type="text" id="letterInput" placeholder="' + I.t("enterWord") + '" autocomplete="off" spellcheck="false" style="text-transform:uppercase;">' +
            '</div>' +
            '<button type="button" class="btn btn-primary check-btn" id="checkBtn" style="margin-top:20px;">' + I.t("check") + '</button>';
        area.appendChild(card);

        const input = card.querySelector("#letterInput");
        const btn = card.querySelector("#checkBtn");

        input.focus();
        input.addEventListener("keydown", (e) => { if (e.key === "Enter") btn.click(); });

        btn.addEventListener("click", () => {
            if (locked) return;
            const val = (input.value || "").trim().toUpperCase();
            if (!val) { input.focus(); return; }
            locked = true;
            answers[index] = val;
            input.disabled = true;
            btn.disabled = true;
            playOk();
            setTimeout(nextQuestion, 500);
        });
    }

    /* =========================================================
       SWIPE
       ========================================================= */

    function renderSwipe(q, area) {
        const card = document.createElement("div");
        card.className = "q-card swipe-card";
        card.innerHTML =
            '<div class="q-label">' + I.t("trueOrFalse") + '</div>' +
            '<div class="swipe-stage">' +
                '<div class="swipe-hint swipe-hint--left">' + I.t("wrongLabel") + '</div>' +
                '<div class="swipe-hint swipe-hint--right">' + I.t("rightLabel") + '</div>' +
                '<div class="swipe-item" id="swipeItem">' +
                    '<div class="swipe-item__text">' + esc(q.prompt) + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="swipe-actions">' +
                '<button type="button" class="swipe-btn swipe-btn--no" data-ans="0">' + I.t("wrongLabel") + '</button>' +
                '<button type="button" class="swipe-btn swipe-btn--yes" data-ans="1">' + I.t("rightLabel") + '</button>' +
            '</div>';
        area.appendChild(card);

        const item = card.querySelector("#swipeItem");
        const hintLeft = card.querySelector(".swipe-hint--left");
        const hintRight = card.querySelector(".swipe-hint--right");

        let startX = 0, currentX = 0, dragging = false;

        function onStart(e) {
            if (locked) return;
            dragging = true;
            startX = (e.touches ? e.touches[0].clientX : e.clientX);
        }
        function onMove(e) {
            if (!dragging || locked) return;
            currentX = (e.touches ? e.touches[0].clientX : e.clientX) - startX;
            item.style.transform = "translateX(" + currentX + "px) rotate(" + (currentX / 20) + "deg)";
            item.style.opacity = 1 - Math.min(Math.abs(currentX) / 300, 0.6);
            hintLeft.style.opacity = currentX < -20 ? Math.min(Math.abs(currentX) / 100, 1) : 0;
            hintRight.style.opacity = currentX > 20 ? Math.min(currentX / 100, 1) : 0;
        }
        function onEnd() {
            if (!dragging || locked) return;
            dragging = false;
            if (currentX < -80)      answer(false);
            else if (currentX > 80)  answer(true);
            else {
                item.style.transform = "";
                item.style.opacity = "";
                hintLeft.style.opacity = 0;
                hintRight.style.opacity = 0;
            }
            currentX = 0;
        }

        item.addEventListener("mousedown", onStart);
        item.addEventListener("touchstart", onStart, { passive: true });
        document.addEventListener("mousemove", onMove);
        document.addEventListener("touchmove", onMove, { passive: true });
        document.addEventListener("mouseup", onEnd);
        document.addEventListener("touchend", onEnd);

        card.querySelectorAll(".swipe-btn").forEach((btn) => {
            btn.addEventListener("click", () => answer(btn.dataset.ans === "1"));
        });

        function answer(value) {
            if (locked) return;
            locked = true;
            answers[index] = value;

            item.style.transition = "transform .35s ease, opacity .35s ease";
            item.style.transform = value ? "translateX(500px) rotate(30deg)" : "translateX(-500px) rotate(-30deg)";
            item.style.opacity = 0;
            if (value) playOk(); else playNo();

            setTimeout(() => {
                document.removeEventListener("mousemove", onMove);
                document.removeEventListener("touchmove", onMove);
                document.removeEventListener("mouseup", onEnd);
                document.removeEventListener("touchend", onEnd);
                nextQuestion();
            }, 380);
        }
    }

    /* =========================================================
       NEXT / SUBMIT
       ========================================================= */

    function nextQuestion() { index++; render(); }

    async function submit() {
        const page = document.getElementById("taskPage");
        page.innerHTML = '<p class="task-topbar__meta" style="text-align:center;padding:60px 0;">' + I.t("checking") + '</p>';

        try {
            const result = await window.QalamAPI.checkTask(task.id, session, answers);

            if (result.question_ids && result.question_ids.length) {
                addSeen(task.id, result.question_ids);
            }

            renderResult(result);
        } catch (err) {
            console.error(err);
            page.innerHTML =
                '<p class="task-topbar__meta" style="text-align:center;padding:40px 0;">' + esc(err.message) + '</p>' +
                '<div style="text-align:center;"><a href="index.html" class="btn btn-primary">' + I.t("toMain") + '</a></div>';
        }
    }

    function renderResult(result) {
        const stars = result.accuracy === 100 ? 3 : result.accuracy >= 60 ? 2 : result.accuracy > 0 ? 1 : 0;
        let starsHtml = "";
        for (let i = 0; i < 3; i++) {
            starsHtml += '<span class="result__star' + (i < stars ? " on" : "") + '">★</span>';
        }

        let title = I.t("tryAgain");
        if (result.accuracy === 100)      { title = I.t("great"); playWin(); }
        else if (result.accuracy >= 60)   { title = I.t("good"); playOk(); }
        else                              { playNo(); }

        const newSeen = getSeen(task.id).length;
        const total = stats ? stats.total : task.questions.length;
        const left = Math.max(0, total - newSeen);

        let progressMsg;
        if (newSeen >= total) {
            progressMsg = '<div class="result__progress-msg result__progress-msg--done">' + I.t("learnedAll", { total: total }) + '</div>';
        } else {
            progressMsg = '<div class="result__progress-msg">' + I.t("learnedProgress", { seen: newSeen, total: total, left: left }) + '</div>';
        }

        let reviewHtml = '<div class="review"><div class="review__head">' + I.t("reviewHead") + '</div>';
        result.details.forEach((d, i) => {
            const q = task.questions[i];
            let userText = "";
            let correctText = "";

            if (task.type === "choice") {
                userText = q.options[d.user_answer] || "—";
                correctText = q.options[d.correct_answer] || "—";
            } else if (task.type === "letters") {
                userText = d.user_answer || "—";
                correctText = d.correct_answer || "—";
            } else {
                userText = d.user_answer ? I.t("rightLabel").replace("✓ ", "") : I.t("wrongLabel").replace("✕ ", "");
                correctText = d.correct_answer ? I.t("rightLabel").replace("✓ ", "") : I.t("wrongLabel").replace("✕ ", "");
            }

            reviewHtml +=
                '<div class="review__item">' +
                    '<div class="review__icon review__icon--' + (d.is_correct ? "ok" : "no") + '">' +
                        (d.is_correct ? "✓" : "✕") +
                    '</div>' +
                    '<div class="review__body">' +
                        '<div class="review__prompt">' + esc(q.prompt) + '</div>' +
                        '<div class="review__answer">' + I.t("yourAnswer") + ': <b>' + esc(userText) + '</b>' +
                        (d.is_correct ? "" : ' · ' + I.t("correctAnswer") + ': <b>' + esc(correctText) + '</b>') +
                        '</div>' +
                    '</div>' +
                '</div>';
        });
        reviewHtml += '</div>';

        const page = document.getElementById("taskPage");
        page.innerHTML =
            '<div class="result">' +
                '<div class="result__stars">' + starsHtml + '</div>' +
                '<div class="result__title">' + title + '</div>' +
                '<div class="result__score">' + result.score + ' / ' + result.total + '</div>' +
                '<div class="result__accuracy">' + I.t("accuracy", { n: result.accuracy }) + '</div>' +
                progressMsg +
                '<div class="result__actions">' +
                    '<a href="task.html?id=' + encodeURIComponent(task.id) + '" class="btn btn-primary">' + I.t("continueLearning") + '</a>' +
                    '<a href="index.html" class="btn btn-outline">' + I.t("toTasks") + '</a>' +
                '</div>' +
                '<button type="button" class="reset-progress-btn" id="resetBtn">' + I.t("resetProgress") + '</button>' +
                reviewHtml +
            '</div>';

        const resetBtn = document.getElementById("resetBtn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                if (!confirm(I.t("resetConfirm"))) return;
                resetSeen(task.id);
                location.reload();
            });
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function renderExhausted() {
        const page = document.getElementById("taskPage");
        page.innerHTML =
            '<div class="result">' +
                '<div class="result__stars">' +
                    '<span class="result__star on">★</span>' +
                    '<span class="result__star on">★</span>' +
                    '<span class="result__star on">★</span>' +
                '</div>' +
                '<div class="result__title">' + I.t("allLearned") + '</div>' +
                '<div class="result__score">' + stats.total + ' / ' + stats.total + '</div>' +
                '<div class="result__accuracy">' + I.t("allLearnedSub") + '</div>' +
                '<div class="result__actions">' +
                    '<button type="button" class="btn btn-primary" id="startOverBtn">' + I.t("startOver") + '</button>' +
                    '<a href="index.html" class="btn btn-outline">' + I.t("toTasks") + '</a>' +
                '</div>' +
            '</div>';

        const btn = document.getElementById("startOverBtn");
        if (btn) {
            btn.addEventListener("click", () => {
                if (!confirm(I.t("resetConfirm"))) return;
                resetSeen(task.id);
                location.reload();
            });
        }
    }

    /* =========================================================
       SOUND + UTILS
       ========================================================= */

    let audioCtx = null;
    function beep(freq, dur, type) {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = type || "sine";
            o.frequency.value = freq;
            const now = audioCtx.currentTime;
            g.gain.setValueAtTime(0.06, now);
            g.gain.exponentialRampToValueAtTime(0.001, now + dur);
            o.connect(g); g.connect(audioCtx.destination);
            o.start(now); o.stop(now + dur);
        } catch (e) {}
    }
    function playOk() { beep(660, 0.1); setTimeout(() => beep(880, 0.14), 90); }
    function playNo() { beep(280, 0.2, "triangle"); }
    function playWin() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.18), i * 120)); }

    function esc(s) {
        return String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
        }[c]));
    }
})();