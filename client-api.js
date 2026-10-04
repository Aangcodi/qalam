/* =========================================================
   QalamAPI — Firebase Firestore backend
   ========================================================= */
(function () {
    "use strict";

    // ============ КОНФИГ FIREBASE ============
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyCodc-dFXDzC3pEDDpQAS-H7RO7ZQEtU_w",
        authDomain: "qalam-1ba7f.firebaseapp.com",
        projectId: "qalam-1ba7f",
        storageBucket: "qalam-1ba7f.firebasestorage.app",
        messagingSenderId: "475644152972",
        appId: "1:475644152972:web:963a9df2b2041de11b3fa9"
    };
    // ========================================

    const DOC_PATH = ["site", "tasks"];   // коллекция / документ
    const LS_FALLBACK = "qalam_tasks_fallback";

    let _fb = null;
    let _tasksCache = null;
    const _sessions = new Map();

    /* ---------- FIREBASE INIT (dynamic import) ---------- */

    async function fb() {
        if (_fb) return _fb;

        const [
            { initializeApp },
            { getFirestore, doc, getDoc, setDoc },
            { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence },
        ] = await Promise.all([
            import("https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js"),
            import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"),
            import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js"),
        ]);

        const app = initializeApp(FIREBASE_CONFIG);
        const db = getFirestore(app);
        const auth = getAuth(app);

        try { await setPersistence(auth, browserLocalPersistence); } catch (e) {}

        _fb = {
            app, db, auth,
            doc, getDoc, setDoc,
            signInWithEmailAndPassword, signOut, onAuthStateChanged,
            docRef: doc(db, DOC_PATH[0], DOC_PATH[1]),
        };
        return _fb;
    }

    /* ---------- УТИЛИТЫ ---------- */

    function shuffle(arr) {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function normalizeDifficulty(d) {
        d = String(d || "normal").toLowerCase();
        return ["easy", "normal", "hard"].includes(d) ? d : "normal";
    }

    function questionId(q) {
        const s = (q.prompt || "").trim();
        let h = 0;
        for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
        return "q" + Math.abs(h).toString(36);
    }

    function genId() {
        return "task_" + Math.random().toString(36).slice(2, 10);
    }

    /* ---------- ЧТЕНИЕ/ЗАПИСЬ ДАННЫХ ---------- */

    async function loadData(forceReload) {
        if (_tasksCache && !forceReload) return _tasksCache;

        try {
            const f = await fb();
            const snap = await f.getDoc(f.docRef);
            if (snap.exists()) {
                const data = snap.data();
                if (data && Array.isArray(data.tasks)) {
                    _tasksCache = data;
                    try {
                        localStorage.setItem(LS_FALLBACK, JSON.stringify(data));
                    } catch (e) {}
                    return data;
                }
            }
        } catch (e) {
            console.warn("Firebase read failed, fallback:", e);
        }

        // фолбэк: локальный кэш
        try {
            const cached = localStorage.getItem(LS_FALLBACK);
            if (cached) {
                _tasksCache = JSON.parse(cached);
                return _tasksCache;
            }
        } catch (e) {}

        // фолбэк: файл tasks.json из репозитория
        const res = await fetch("tasks.json", { cache: "no-cache" });
        if (!res.ok) throw new Error("Не удалось загрузить tasks.json");
        _tasksCache = await res.json();
        return _tasksCache;
    }

    async function saveData(data) {
        const f = await fb();
        if (!f.auth.currentUser) throw new Error("Вы не вошли как админ");
        await f.setDoc(f.docRef, data);
        _tasksCache = data;
        try { localStorage.setItem(LS_FALLBACK, JSON.stringify(data)); } catch (e) {}
        return data;
    }

    /* ---------- АДМИН-МУТАЦИИ ---------- */

    async function adminMutate(mutator) {
        const current = await loadData(true);
        const copy = JSON.parse(JSON.stringify(current));
        copy.tasks = copy.tasks || [];
        const result = mutator(copy);
        await saveData(copy);
        return result;
    }

    /* ---------- ПУБЛИЧНОЕ API ---------- */

    window.QalamAPI = {

        /* ----- Публичные эндпоинты ----- */

        async listTasks(difficulty) {
            const data = await loadData();
            const out = [];
            for (const t of (data.tasks || [])) {
                const diff = normalizeDifficulty(t.difficulty);
                if (difficulty && difficulty !== diff) continue;
                out.push({
                    id: t.id,
                    type: t.type || "choice",
                    difficulty: diff,
                    title: t.title || "",
                    description: t.description || "",
                    icon: t.icon || "?",
                    count: (t.questions || []).length,
                });
            }
            return { tasks: out };
        },

        async getTask(taskId, seen, count) {
            const data = await loadData();
            const task = (data.tasks || []).find(t => t.id === taskId);
            if (!task) throw new Error("Задание не найдено");

            const qtype = task.type || "choice";
            const original = task.questions || [];
            const total = original.length;
            const seenSet = new Set((seen || "").split(",").map(s => s.trim()).filter(Boolean));
            const indexed = original.map(q => [questionId(q), q]);
            const unseen = indexed.filter(([qid]) => !seenSet.has(qid));

            const cnt = Math.max(1, Math.min(count || 20, 50));
            const selected = shuffle(unseen).slice(0, cnt);
            const exhausted = unseen.length === 0;

            const questions = [];
            const correctAnswers = [];
            const selectedIds = [];

            for (const [qid, q] of selected) {
                selectedIds.push(qid);
                if (qtype === "choice") {
                    const indexedOpts = (q.options || []).map((text, i) => ({ text, i }));
                    const shuffled = shuffle(indexedOpts);
                    let oldCorrect = parseInt(q.correct);
                    if (isNaN(oldCorrect)) oldCorrect = 0;
                    const correct = shuffled.findIndex(o => o.i === oldCorrect);
                    questions.push({ id: qid, prompt: q.prompt || "", options: shuffled.map(o => o.text) });
                    correctAnswers.push(correct < 0 ? 0 : correct);
                } else if (qtype === "letters") {
                    questions.push({ id: qid, prompt: q.prompt || "" });
                    correctAnswers.push((q.answer || "").trim().toUpperCase());
                } else {
                    questions.push({ id: qid, prompt: q.prompt || "" });
                    correctAnswers.push(!!q.correct);
                }
            }

            const session = "s_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
            _sessions.set(session, { taskId, taskType: qtype, correctAnswers, questionIds: selectedIds });

            const validIds = new Set(indexed.map(([qid]) => qid));
            const actuallySeen = [...seenSet].filter(s => validIds.has(s)).length;

            return {
                id: task.id,
                type: qtype,
                difficulty: normalizeDifficulty(task.difficulty),
                title: task.title || "",
                description: task.description || "",
                icon: task.icon || "?",
                session,
                questions,
                stats: {
                    total,
                    seen: actuallySeen,
                    selected: selected.length,
                    remaining: Math.max(0, unseen.length - selected.length),
                    exhausted,
                },
            };
        },

        async checkTask(taskId, session, answers) {
            const s = _sessions.get(session);
            if (!s) throw new Error("Сессия истекла. Обнови страницу.");
            if (s.taskId !== taskId) throw new Error("Несовпадение сессии");

            const { correctAnswers, questionIds, taskType } = s;
            if (!Array.isArray(answers) || answers.length !== correctAnswers.length) {
                throw new Error("Неверное количество ответов");
            }

            const details = [];
            let correctCount = 0;

            for (let i = 0; i < answers.length; i++) {
                const u = answers[i], c = correctAnswers[i];
                let ok = false;
                if (taskType === "choice")       ok = parseInt(u) === parseInt(c);
                else if (taskType === "letters") ok = String(u || "").trim().toUpperCase() === String(c);
                else                             ok = !!u === !!c;

                if (ok) correctCount++;
                details.push({ index: i, user_answer: u, correct_answer: c, is_correct: ok });
            }

            _sessions.delete(session);
            return {
                score: correctCount,
                total: correctAnswers.length,
                accuracy: correctAnswers.length
                    ? Math.round(correctCount / correctAnswers.length * 100) : 0,
                details,
                question_ids: questionIds,
            };
        },

        /* ----- АВТОРИЗАЦИЯ (Firebase Auth) ----- */

        async login(email, password) {
            const f = await fb();
            await f.signInWithEmailAndPassword(f.auth, email, password);
            return { status: "ok", email: f.auth.currentUser.email };
        },

        async logout() {
            const f = await fb();
            await f.signOut(f.auth);
        },

        async currentUser() {
            const f = await fb();
            return new Promise((resolve) => {
                const unsub = f.onAuthStateChanged(f.auth, (u) => {
                    unsub();
                    resolve(u);
                });
            });
        },

        async onAuthChange(cb) {
            const f = await fb();
            f.onAuthStateChanged(f.auth, cb);
        },

        /* ----- АДМИНКА ----- */

        async adminList() {
            return await loadData(true);
        },

        async adminGet(taskId) {
            const data = await loadData(true);
            const t = (data.tasks || []).find(x => x.id === taskId);
            if (!t) throw new Error("Задание не найдено");
            return t;
        },

        async adminCreate(record) {
            return await adminMutate((copy) => {
                const r = { ...record, id: genId(), difficulty: normalizeDifficulty(record.difficulty) };
                copy.tasks.push(r);
                return r;
            });
        },

        async adminUpdate(taskId, record) {
            return await adminMutate((copy) => {
                const i = copy.tasks.findIndex(t => t.id === taskId);
                if (i < 0) throw new Error("Задание не найдено");
                copy.tasks[i] = { ...record, id: taskId, difficulty: normalizeDifficulty(record.difficulty) };
                return copy.tasks[i];
            });
        },

        async adminDelete(taskId) {
            return await adminMutate((copy) => {
                const before = copy.tasks.length;
                copy.tasks = copy.tasks.filter(t => t.id !== taskId);
                if (copy.tasks.length === before) throw new Error("Задание не найдено");
                return { status: "ok" };
            });
        },

        async adminExport() {
            return await loadData(true);
        },

        async adminImport(payload, mode) {
            const raw = payload.tasks;
            if (!Array.isArray(raw)) throw new Error("Файл должен содержать массив 'tasks'");

            const validated = [];
            const errors = [];

            raw.forEach((t, idx) => {
                try {
                    if (!t || typeof t !== "object") throw new Error("Не объект");
                    const title = String(t.title || "").trim();
                    if (!title) throw new Error("Нет title");
                    const qtype = t.type || "choice";
                    if (!["choice", "letters", "swipe"].includes(qtype)) throw new Error("Неизвестный тип");
                    const questions = t.questions || [];
                    if (!Array.isArray(questions) || !questions.length) throw new Error("Нет вопросов");

                    const cleanQs = questions.map((q, qi) => {
                        const prompt = String(q.prompt || "").trim();
                        if (!prompt) throw new Error(`Вопрос ${qi + 1}: нет prompt`);

                        if (qtype === "choice") {
                            const opts = (q.options || []).map(o => String(o).trim()).filter(Boolean);
                            if (opts.length < 2) throw new Error(`Вопрос ${qi + 1}: минимум 2 варианта`);
                            let c = parseInt(q.correct) || 0;
                            if (c < 0 || c >= opts.length) c = 0;
                            return { prompt, options: opts, correct: c };
                        }
                        if (qtype === "letters") {
                            const answer = String(q.answer || "").trim().toUpperCase();
                            if (!answer) throw new Error(`Вопрос ${qi + 1}: нет answer`);
                            return { prompt, answer };
                        }
                        let c = q.correct;
                        if (typeof c === "string") c = ["true", "1", "yes", "верно"].includes(c.toLowerCase());
                        return { prompt, correct: !!c };
                    });

                    validated.push({
                        id: t.id || genId(),
                        type: qtype,
                        difficulty: normalizeDifficulty(t.difficulty),
                        title,
                        description: String(t.description || "").trim().slice(0, 200),
                        icon: String(t.icon || "?").slice(0, 2) || "?",
                        questions: cleanQs,
                    });
                } catch (e) {
                    errors.push(`Задание #${idx + 1}: ${e.message}`);
                }
            });

            if (!validated.length) throw new Error("Ни одно задание не прошло валидацию. " + errors.join("; "));

            const total = await adminMutate((copy) => {
                if (mode === "replace") {
                    copy.tasks = validated;
                } else {
                    const ids = new Set(copy.tasks.map(t => t.id));
                    for (const t of validated) {
                        if (ids.has(t.id)) t.id = genId();
                        ids.add(t.id);
                    }
                    copy.tasks.push(...validated);
                }
                return copy.tasks.length;
            });

            return { status: "ok", imported: validated.length, errors, total_tasks: total };
        },
    };
})();