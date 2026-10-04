(function () {
    "use strict";

    const I = window.QalamI18n;

    let currentLevel = "easy";
    let allTasks = [];

    document.addEventListener("DOMContentLoaded", () => {
        setupLevelSwitch();
        setupDemoCard();
        load();
    });

    document.addEventListener("qalam:lang", () => {
        const filtered = getFiltered();
        render(filtered);
        updateStats(filtered);
    });

    /* =========================================================
       LEVEL SWITCH
       ========================================================= */

    function setupLevelSwitch() {
        document.querySelectorAll(".level-switch__btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                currentLevel = btn.dataset.level;
                document.querySelectorAll(".level-switch__btn").forEach((b) => {
                    b.classList.toggle("is-active", b.dataset.level === currentLevel);
                });
                const filtered = getFiltered();
                render(filtered);
                updateStats(filtered);
            });
        });
    }

    function getFiltered() {
        return allTasks.filter((t) => (t.difficulty || "normal") === currentLevel);
    }

    /* =========================================================
       LOAD TASKS  — теперь через QalamAPI
       ========================================================= */

    async function load() {
        const box = document.getElementById("cards");
        try {
            const data = await window.QalamAPI.listTasks();
            allTasks = data.tasks || [];

            const filtered = getFiltered();
            updateStats(filtered);
            render(filtered);
        } catch (err) {
            console.error(err);
            box.innerHTML = '<p class="empty">' + I.t("errorLoad") + '</p>';
        }
    }

    function getSeenCount(id) {
        try {
            const arr = JSON.parse(localStorage.getItem("qalam_seen_" + id) || "[]");
            return Array.isArray(arr) ? arr.length : 0;
        } catch (e) { return 0; }
    }

    function updateStats(tasks) {
        const totalQ = tasks.reduce((s, t) => s + (t.count || 0), 0);
        setText("statTasks", tasks.length);
        setText("statQuestions", totalQ);
    }

    function render(tasks) {
        const box = document.getElementById("cards");
        box.innerHTML = "";

        if (!tasks.length) {
            box.innerHTML = '<p class="empty">' + I.t("levelEmpty") + '</p>';
            return;
        }

        tasks.forEach((t) => {
            const seen = getSeenCount(t.id);
            const total = t.count || 0;
            const done = total > 0 && seen >= total;

            const card = document.createElement("a");
            card.className = "card";
            card.href = "task.html?id=" + encodeURIComponent(t.id);

            let progressLabel = "";
            if (total === 0) {
                progressLabel = "0 " + I.t("questions");
            } else if (done) {
                progressLabel = I.t("done");
            } else if (seen > 0) {
                progressLabel = I.t("seen") + " " + seen + " / " + total;
            } else {
                progressLabel = total + " " + I.t("questions");
            }

            const goLabel = done ? I.t("repeat") : (seen > 0 ? I.t("cont") : I.t("start"));

            card.innerHTML =
                '<div class="card__icon">' + esc(t.icon || "?") + '</div>' +
                '<div class="card__title">' + esc(t.title) + '</div>' +
                '<div class="card__desc">' + esc(t.description || "") + '</div>' +
                '<div class="card__meta">' +
                    '<span class="card__count' + (done ? ' card__count--done' : '') + '">' +
                        (done ? '<span class="card__check">✓</span>' : '') +
                        esc(progressLabel) +
                    '</span>' +
                    '<span class="card__go">' + esc(goLabel) + ' →</span>' +
                '</div>';

            box.appendChild(card);
        });
    }

    /* =========================================================
       ДЕМО-КАРТОЧКА — циклическая смена при скролле
       ========================================================= */

    function setupDemoCard() {
        const card = document.getElementById("demoCard");
        const counter = document.getElementById("demoCounter");
        const label = document.getElementById("demoLabel");
        const prompt = document.getElementById("demoPrompt");
        const optionsEl = document.getElementById("demoOptions");

        if (!card || !counter || !label || !prompt || !optionsEl) return;

        const CARDS = [
            { label: "Лексика",    prompt: "МЕКТЕП", options: ["Книга", "Школа", "Учитель"], correct: 1 },
            { label: "Аударма",    prompt: "КІТАП",  options: ["Сумка", "Книга", "Стол"],    correct: 1 },
            { label: "Грамматика", prompt: "Мен мектеп___ барамын", options: ["ке", "да", "ды"], correct: 0 },
            { label: "Лексика",    prompt: "СУ",     options: ["Вода", "Молоко", "Чай"],    correct: 0 },
            { label: "Аударма",    prompt: "ДОС",    options: ["Враг", "Друг", "Сосед"],    correct: 1 },
            { label: "Лексика",    prompt: "НАН",    options: ["Хлеб", "Мясо", "Сыр"],      correct: 0 },
            { label: "Грамматика", prompt: "Ол кітап___ оқыды", options: ["ты", "ке", "да"], correct: 0 },
            { label: "Лексика",    prompt: "ГҮЛ",    options: ["Дерево", "Цветок", "Трава"], correct: 1 },
            { label: "Аударма",    prompt: "ҮЙ",     options: ["Улица", "Дом", "Город"],    correct: 1 },
            { label: "Лексика",    prompt: "КҮН",    options: ["Луна", "Солнце", "Небо"],   correct: 1 }
        ];

        const TOTAL = CARDS.length;
        const SCROLL_STEP = 120;
        const ANIM_DURATION = 280;

        let currentIndex = 0;
        let isAnimating = false;
        let lastScrollY = window.scrollY || 0;
        let scrollAccum = 0;
        let animLockTimer = null;

        paint(0);

        function paint(index) {
            const data = CARDS[index];
            const num = String(index + 1).padStart(2, "0");
            const tot = String(TOTAL).padStart(2, "0");

            counter.textContent = num + " / " + tot;
            label.textContent = data.label;
            prompt.textContent = data.prompt;

            optionsEl.innerHTML = "";
            data.options.forEach((opt, i) => {
                const div = document.createElement("div");
                div.className = "demo-opt" + (i === data.correct ? " demo-opt--correct" : "");
                div.textContent = opt;
                optionsEl.appendChild(div);
            });
        }

        function changeCard(direction) {
            if (isAnimating) return;
            isAnimating = true;

            currentIndex = ((currentIndex + direction) % TOTAL + TOTAL) % TOTAL;

            card.style.transition = "transform " + ANIM_DURATION + "ms cubic-bezier(.4,0,.2,1), opacity " + ANIM_DURATION + "ms ease";
            card.style.transform = direction > 0 ? "translateX(-110%)" : "translateX(110%)";
            card.style.opacity = "0";

            clearTimeout(animLockTimer);

            animLockTimer = setTimeout(() => {
                paint(currentIndex);

                card.style.transition = "none";
                card.style.transform = direction > 0 ? "translateX(110%)" : "translateX(-110%)";
                card.style.opacity = "0";

                void card.offsetWidth;

                card.style.transition = "transform " + ANIM_DURATION + "ms cubic-bezier(.4,0,.2,1), opacity " + ANIM_DURATION + "ms ease";
                card.style.transform = "translateX(0)";
                card.style.opacity = "1";

                setTimeout(() => {
                    isAnimating = false;
                    card.style.transition = "";
                }, ANIM_DURATION + 20);
            }, ANIM_DURATION + 10);
        }

        window.addEventListener("scroll", () => {
            const y = window.scrollY || 0;
            const delta = y - lastScrollY;
            lastScrollY = y;

            if (isAnimating) return;

            scrollAccum += delta;

            if (Math.abs(scrollAccum) >= SCROLL_STEP) {
                const direction = scrollAccum > 0 ? 1 : -1;
                scrollAccum = 0;
                changeCard(direction);
            }
        }, { passive: true });

        let idleTimer = null;
        window.addEventListener("scroll", () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => { scrollAccum = 0; }, 400);
        }, { passive: true });
    }

    /* =========================================================
       UTILS
       ========================================================= */

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
        }[c]));
    }
})();