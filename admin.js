(function () {
    "use strict";

    const I = window.QalamI18n;

    let tasks = [];
    let editingId = null;
    let taskType = "choice";
    let questions = [];
    let pendingImport = null;

    const $ = (id) => document.getElementById(id);

    document.addEventListener("DOMContentLoaded", () => {
        setupLogin();
        setupEditor();
        setupImportExport();
        verifyAndLoad();
    });

    document.addEventListener("qalam:lang", () => {
        if (tasks.length) renderList();
        if (!$("editorView").hidden) renderQuestions();
    });

    /* =========================================================
       LOGIN (Firebase Auth)
       ========================================================= */

    function setupLogin() {
        $("loginForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = $("email").value.trim();
            const pw = $("pw").value;
            const msg = $("loginMsg");

            if (!email || !pw) { setMsg(msg, "—", "error"); return; }

            setMsg(msg, "...", "");
            try {
                await window.QalamAPI.login(email, pw);
                $("pw").value = "";
                showAdmin();
                loadTasks();
            } catch (err) {
                console.error(err);
                const code = String(err.code || err.message || "");
                if (code.includes("invalid-credential") ||
                    code.includes("wrong-password") ||
                    code.includes("user-not-found") ||
                    code.includes("invalid-email")) {
                    setMsg(msg, I.t("wrongPassword"), "error");
                } else if (code.includes("too-many-requests")) {
                    setMsg(msg, "Слишком много попыток. Подожди немного.", "error");
                } else {
                    setMsg(msg, err.message || I.t("serverError"), "error");
                }
            }
        });
    }

    async function verifyAndLoad() {
        try {
            const user = await window.QalamAPI.currentUser();
            if (user) {
                showAdmin();
                loadTasks();
            } else {
                showLogin();
            }
        } catch (e) {
            console.warn(e);
            showLogin();
        }
    }

    function showLogin() {
        $("loginView").hidden = false;
        $("adminView").hidden = true;
        $("logoutBtn").hidden = true;
    }

    function showAdmin() {
        $("loginView").hidden = true;
        $("adminView").hidden = false;
        $("logoutBtn").hidden = false;
    }

    $("logoutBtn").addEventListener("click", async () => {
        try { await window.QalamAPI.logout(); } catch (e) {}
        location.reload();
    });

    /* =========================================================
       LIST
       ========================================================= */

    async function loadTasks() {
        const box = $("adminList");
        box.innerHTML = '<p class="msg">...</p>';
        try {
            const data = await window.QalamAPI.adminList();
            tasks = data.tasks || [];
            renderList();
        } catch (err) {
            console.error(err);
            box.innerHTML = '<p class="msg error">' + esc(err.message || I.t("serverError")) + '</p>';
        }
    }

    function typeLabel(t) {
        if (t === "choice") return I.t("typeChoice").split(" — ")[0];
        if (t === "letters") return I.t("typeLetters").split(" — ")[0];
        if (t === "swipe") return I.t("typeSwipe").split(" — ")[0];
        return t;
    }

    function levelLabel(l) {
        if (l === "easy") return I.t("levelEasy");
        if (l === "hard") return I.t("levelHard");
        return I.t("levelNormal");
    }

    function levelClass(l) {
        if (l === "easy") return "level-badge--easy";
        if (l === "hard") return "level-badge--hard";
        return "level-badge--normal";
    }

    function renderList() {
        const box = $("adminList");
        box.innerHTML = "";

        if (!tasks.length) {
            box.innerHTML = '<p class="msg">—</p>';
            return;
        }

        tasks.forEach((t) => {
            const diff = t.difficulty || "normal";
            const item = document.createElement("div");
            item.className = "admin-item";
            item.innerHTML =
                '<div class="admin-item__icon">' + esc(t.icon || "?") + '</div>' +
                '<div class="admin-item__body">' +
                    '<div class="admin-item__title">' + esc(t.title) + '</div>' +
                    '<div class="admin-item__desc">' + esc(t.description || "") + '</div>' +
                    '<div class="admin-item__meta">' +
                        (t.questions ? t.questions.length : 0) + ' · ' +
                        esc(typeLabel(t.type || "choice")) + ' · ' +
                        '<span class="level-badge ' + levelClass(diff) + '">' +
                            esc(levelLabel(diff)) +
                        '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="admin-item__actions">' +
                    '<button type="button" class="btn btn-outline" data-edit="' + t.id + '">' + I.t("editTask") + '</button>' +
                    '<button type="button" class="btn btn-danger" data-del="' + t.id + '">' + I.t("deleteTask") + '</button>' +
                '</div>';
            box.appendChild(item);
        });

        box.querySelectorAll("[data-edit]").forEach((b) => {
            b.addEventListener("click", () => startEdit(b.dataset.edit));
        });
        box.querySelectorAll("[data-del]").forEach((b) => {
            b.addEventListener("click", () => deleteTask(b.dataset.del));
        });
    }

    /* =========================================================
       EDITOR
       ========================================================= */

    function setupEditor() {
        $("addBtn").addEventListener("click", startNew);
        $("cancelEditBtn").addEventListener("click", closeEditor);
        $("addQuestionBtn").addEventListener("click", addQuestion);
        $("taskForm").addEventListener("submit", saveTask);

        $("type").addEventListener("change", (e) => {
            const newType = e.target.value;
            if (newType === taskType) return;
            if (questions.length && !confirm("Сменить тип? Вопросы пересоздадутся.")) {
                e.target.value = taskType;
                return;
            }
            taskType = newType;
            questions = [makeEmptyQuestion()];
            renderQuestions();
        });
    }

    function makeEmptyQuestion() {
        if (taskType === "letters") return { prompt: "", answer: "" };
        if (taskType === "swipe")   return { prompt: "", correct: true };
        return { prompt: "", options: ["", "", "", ""], correct: 0 };
    }

    function startNew() {
        editingId = null;
        taskType = "choice";
        $("editorTitle").textContent = I.t("newTask");
        $("title").value = "";
        $("icon").value = "";
        $("description").value = "";
        $("type").value = "choice";
        $("difficulty").value = "normal";
        questions = [makeEmptyQuestion()];
        renderQuestions();
        setMsg($("editorMsg"), "", "");
        $("editorView").hidden = false;
        window.scrollTo({ top: $("editorView").offsetTop, behavior: "smooth" });
    }

    async function startEdit(id) {
        try {
            const t = await window.QalamAPI.adminGet(id);

            editingId = id;
            taskType = t.type || "choice";
            $("editorTitle").textContent = I.t("editTask");
            $("title").value = t.title || "";
            $("icon").value = t.icon || "";
            $("description").value = t.description || "";
            $("type").value = taskType;
            $("difficulty").value = t.difficulty || "normal";

            questions = (t.questions || []).map((q) => {
                if (taskType === "letters") return { prompt: q.prompt || "", answer: q.answer || "" };
                if (taskType === "swipe")   return { prompt: q.prompt || "", correct: !!q.correct };
                return {
                    prompt: q.prompt || "",
                    options: (q.options || []).concat(["", "", "", ""]).slice(0, Math.max(4, (q.options || []).length)),
                    correct: q.correct || 0,
                };
            });

            if (!questions.length) questions = [makeEmptyQuestion()];

            renderQuestions();
            setMsg($("editorMsg"), "", "");
            $("editorView").hidden = false;
            window.scrollTo({ top: $("editorView").offsetTop, behavior: "smooth" });
        } catch (err) {
            console.error(err);
            alert(err.message || I.t("serverError"));
        }
    }

    function closeEditor() {
        $("editorView").hidden = true;
        editingId = null;
        questions = [];
    }

    function addQuestion() {
        questions.push(makeEmptyQuestion());
        renderQuestions();
    }

    function renderQuestions() {
        const box = $("questionsBox");
        box.innerHTML = "";

        questions.forEach((q, qi) => {
            const el = document.createElement("div");
            el.className = "question";
            let body = "";

            if (taskType === "choice") {
                body =
                    '<div class="field"><label>' + I.t("questionText") + '</label>' +
                    '<input type="text" data-prompt="' + qi + '" value="' + esc(q.prompt) + '" placeholder="' + I.t("enterQuestion") + '"></div>' +
                    '<label style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;">' + I.t("optionsLabel") + '</label>' +
                    '<div class="options-list" data-options="' + qi + '"></div>';
            } else if (taskType === "letters") {
                body =
                    '<div class="field"><label>' + I.t("hint") + '</label>' +
                    '<input type="text" data-prompt="' + qi + '" value="' + esc(q.prompt) + '"></div>' +
                    '<div class="field"><label>' + I.t("correctWord") + '</label>' +
                    '<input type="text" data-answer="' + qi + '" value="' + esc(q.answer) + '"></div>';
            } else {
                body =
                    '<div class="field"><label>' + I.t("statement") + '</label>' +
                    '<input type="text" data-prompt="' + qi + '" value="' + esc(q.prompt) + '"></div>' +
                    '<label style="font-size:11px;font-weight:800;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;">' + I.t("isStatementTrue") + '</label>' +
                    '<div class="swipe-correct-pick" data-swipe="' + qi + '">' +
                        '<label class="radio-pill ' + (q.correct ? "active" : "") + '">' +
                            '<input type="radio" name="swipe-' + qi + '" ' + (q.correct ? "checked" : "") + ' data-swipe-val="1" data-swipe-idx="' + qi + '">' +
                            '<span>✓ ' + I.t("rightLabel").replace("✓ ", "") + '</span>' +
                        '</label>' +
                        '<label class="radio-pill ' + (!q.correct ? "active" : "") + '">' +
                            '<input type="radio" name="swipe-' + qi + '" ' + (!q.correct ? "checked" : "") + ' data-swipe-val="0" data-swipe-idx="' + qi + '">' +
                            '<span>✕ ' + I.t("wrongLabel").replace("✕ ", "") + '</span>' +
                        '</label>' +
                    '</div>';
            }

            el.innerHTML =
                '<div class="question__head">' +
                    '<span class="question__num">' + I.t("questionNFull", { n: qi + 1 }) + '</span>' +
                    '<button type="button" class="question__remove" data-remove="' + qi + '">' + I.t("remove") + '</button>' +
                '</div>' + body;

            box.appendChild(el);

            if (taskType === "choice") {
                const optsBox = el.querySelector('[data-options="' + qi + '"]');
                q.options.forEach((opt, oi) => {
                    const wrap = document.createElement("div");
                    wrap.className = "option-input" + (oi === q.correct ? " is-correct" : "");
                    wrap.innerHTML =
                        '<label>' +
                            '<input type="radio" name="correct-' + qi + '" ' + (oi === q.correct ? "checked" : "") + ' data-correct="' + qi + '" data-oi="' + oi + '">' +
                            '<span class="opt-letter-badge">' + String.fromCharCode(65 + oi) + '</span>' +
                            (oi === q.correct ? '<span class="opt-check">✓</span>' : '') +
                        '</label>' +
                        '<input type="text" data-opt="' + qi + '-' + oi + '" value="' + esc(opt) + '" placeholder="' + I.t("variant") + '">';
                    optsBox.appendChild(wrap);
                });
            }
        });

        box.querySelectorAll("[data-remove]").forEach((btn) => {
            btn.addEventListener("click", () => {
                questions.splice(parseInt(btn.dataset.remove, 10), 1);
                if (!questions.length) questions.push(makeEmptyQuestion());
                renderQuestions();
            });
        });
        box.querySelectorAll("[data-prompt]").forEach((input) => {
            input.addEventListener("input", () => {
                questions[parseInt(input.dataset.prompt, 10)].prompt = input.value;
            });
        });
        box.querySelectorAll("[data-answer]").forEach((input) => {
            input.addEventListener("input", () => {
                questions[parseInt(input.dataset.answer, 10)].answer = input.value;
            });
        });
        box.querySelectorAll("[data-opt]").forEach((input) => {
            input.addEventListener("input", () => {
                const p = input.dataset.opt.split("-").map(Number);
                questions[p[0]].options[p[1]] = input.value;
            });
        });
        box.querySelectorAll("[data-correct]").forEach((radio) => {
            radio.addEventListener("change", () => {
                const qi = parseInt(radio.dataset.correct, 10);
                const oi = parseInt(radio.dataset.oi, 10);
                questions[qi].correct = oi;
                renderQuestions();
            });
        });
        box.querySelectorAll("[data-swipe-val]").forEach((radio) => {
            radio.addEventListener("change", () => {
                const qi = parseInt(radio.dataset.swipeIdx, 10);
                questions[qi].correct = radio.dataset.swipeVal === "1";
                renderQuestions();
            });
        });
    }

    async function saveTask(e) {
        e.preventDefault();
        const msg = $("editorMsg");
        const title = $("title").value.trim();
        const icon = $("icon").value.trim() || "?";
        const description = $("description").value.trim();
        const difficulty = $("difficulty").value || "normal";

        if (!title) { setMsg(msg, I.t("fillTitle"), "error"); return; }

        const payloadQuestions = [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (taskType === "letters") {
                if (!q.prompt.trim() || !q.answer.trim()) {
                    setMsg(msg, I.t("fillPromptAndWord", { n: i + 1 }), "error"); return;
                }
                payloadQuestions.push({ prompt: q.prompt.trim(), answer: q.answer.trim().toUpperCase() });
            } else if (taskType === "swipe") {
                if (!q.prompt.trim()) { setMsg(msg, I.t("fillStatement", { n: i + 1 }), "error"); return; }
                payloadQuestions.push({ prompt: q.prompt.trim(), correct: !!q.correct });
            } else {
                if (!q.prompt.trim()) { setMsg(msg, I.t("fillQuestionN", { n: i + 1 }), "error"); return; }
                const opts = q.options.map((o) => o.trim()).filter((o) => o.length > 0);
                if (opts.length < 2) { setMsg(msg, I.t("minTwoOptions", { n: i + 1 }), "error"); return; }
                payloadQuestions.push({
                    prompt: q.prompt.trim(),
                    options: opts,
                    correct: Math.min(q.correct, opts.length - 1),
                });
            }
        }

        const payload = {
            title, icon, description,
            type: taskType,
            difficulty: difficulty,
            questions: payloadQuestions,
        };

        setMsg(msg, I.t("saving"), "");

        try {
            if (editingId) await window.QalamAPI.adminUpdate(editingId, payload);
            else           await window.QalamAPI.adminCreate(payload);

            setMsg(msg, I.t("saved"), "success");
            closeEditor();
            loadTasks();
        } catch (err) {
            console.error(err);
            setMsg(msg, err.message || I.t("serverError"), "error");
        }
    }

    async function deleteTask(id) {
        if (!confirm(I.t("deleteConfirm"))) return;
        try {
            await window.QalamAPI.adminDelete(id);
            loadTasks();
        } catch (err) {
            console.error(err);
            alert(err.message || I.t("serverError"));
        }
    }

    /* =========================================================
       IMPORT / EXPORT
       ========================================================= */

    function setupImportExport() {
        $("exportBtn").addEventListener("click", exportTasks);
        $("importBtn").addEventListener("click", () => $("importFile").click());
        $("importFile").addEventListener("change", onFileChosen);

        document.querySelectorAll("#importModal [data-mode]").forEach((b) => {
            b.addEventListener("click", () => doImport(b.dataset.mode));
        });
        document.querySelectorAll("#importModal [data-close-modal]").forEach((el) => {
            el.addEventListener("click", closeImportModal);
        });
    }

    async function exportTasks() {
        try {
            const data = await window.QalamAPI.adminExport();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "qalam-tasks-" + new Date().toISOString().slice(0, 10) + ".json";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            alert(err.message || I.t("serverError"));
        }
    }

    async function onFileChosen(e) {
        const file = e.target.files[0];
        e.target.value = "";
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data || !Array.isArray(data.tasks)) {
                alert(I.t("chooseFileFirst"));
                return;
            }

            pendingImport = data;
            const info = $("importInfo");
            info.hidden = false;
            info.textContent = "«" + file.name + "» — " + data.tasks.length + " " + I.t("statTasks");

            $("importModalText").textContent = data.tasks.length + " — " + I.t("importSub");
            setMsg($("importMsg"), "", "");
            $("importModal").hidden = false;
        } catch (err) {
            console.error(err);
            alert(I.t("invalidJson"));
        }
    }

    function closeImportModal() {
        $("importModal").hidden = true;
        pendingImport = null;
        setMsg($("importMsg"), "", "");
    }

    async function doImport(mode) {
        if (!pendingImport) return;
        const msg = $("importMsg");
        setMsg(msg, I.t("importing"), "");

        try {
            const result = await window.QalamAPI.adminImport(pendingImport, mode);
            setMsg(msg, I.t("importedN", { n: result.imported }), "success");
            setTimeout(() => { closeImportModal(); loadTasks(); }, 900);
        } catch (err) {
            console.error(err);
            setMsg(msg, err.message || I.t("importError"), "error");
        }
    }

    /* =========================================================
       UTILS
       ========================================================= */

    function setMsg(el, text, kind) {
        el.textContent = text;
        el.className = "msg" + (kind ? " " + kind : "");
    }

    function esc(s) {
        return String(s || "").replace(/[&<>"']/g, (c) => ({
            "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
        }[c]));
    }
})();