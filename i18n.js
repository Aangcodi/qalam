(function () {
    "use strict";

    const TRANSLATIONS = {
        kk: {
            resetLocal: "Локалды өзгерістерді тазалау",
            resetLocalConfirm: "Локалды өзгерістерді тазалайсың ба? tasks.json-ға қайтасың.",
            resetLocalNothing: "Локалды өзгерістер жоқ.",
            tagline: "Қазақ тілін ойнап үйрен",
            heroEyebrow: "Білім платформасы",
            heroTitle1: "Оқы.",
            heroTitle2: "Жаттық.",
            heroTitle3: "Өс.",
            heroSub: "Қазақ тілін қысқа интерактивті тапсырмалар арқылы үйрен. Тақырып таңда, сұрақтарға жауап бер және нәтижені бірден көр.",
            statTasks: "тапсырма",
            statQuestions: "сұрақ",
            statFree: "тегін",
            chooseTask: "Тапсырма таңда",
            chooseTaskSub: "Кез келген тақырыптан баста — барлығы тегін",
            loading: "Жүктелуде...",
            errorLoad: "Тапсырмаларды жүктеу мүмкін болмады.",
            noTasks: "Әзірге тапсырма жоқ.",
            questions: "сұрақ",
            seen: "Зерттелді",
            done: "Өтілді",
            start: "Бастау",
            cont: "Жалғастыру",
            repeat: "Қайталау",
            back: "← Артқа",
            questionN: "Сұрақ {n} / {total}",
            seenN: "Зерттелді: {seen} / {total}",
            writeWord: "Қазақша сөзді жаз",
            enterWord: "Сөзді енгіз",
            check: "Тексеру",
            trueOrFalse: "Дұрыс па, әлде бұрыс па?",
            wrongLabel: "✕ Бұрыс",
            rightLabel: "✓ Дұрыс",
            checking: "Тексерілуде...",
            tryAgain: "Қайталап көр",
            great: "Керемет!",
            good: "Жарайсың!",
            accuracy: "Дәлдік: {n}%",
            allLearned: "Барлығы зерттелді!",
            allLearnedSub: "Сен осы тапсырманың барлық сұрағынан өттің",
            learnedProgress: "Зерттелді: <b>{seen} / {total}</b> · Қалды: <b>{left}</b>",
            learnedAll: "🎉 Сен барлық {total} сұрақты зерттедің! Прогресті қалпына келтіріп, қайта бастауға болады.",
            reviewHead: "Жауаптарды талдау",
            yourAnswer: "Сенің",
            correctAnswer: "Дұрыс",
            continueLearning: "Оқуды жалғастыру",
            toTasks: "Тапсырмаларға",
            resetProgress: "Осы тапсырма бойынша прогресті тазалау",
            startOver: "Қайта бастау",
            resetConfirm: "Прогресті тазалайсың ба? Сұрақтар қайтадан басталады.",
            toMain: "Басты бетке",
            notFound: "Тапсырма табылмады",
            serverError: "Сервер қатесі",
            loadError: "Жүктеу қатесі",
            levelEasy: "Жеңіл",
            levelNormal: "Орташа",
            levelHard: "Қиын",
            levelEmpty: "Бұл деңгейде әзірге тапсырма жоқ",
            difficulty: "Қиындық",
            adminLogin: "Панельге кіру",
            adminLoginSub: "Тапсырмаларды басқару үшін құпия сөзді енгіз",
            password: "Құпия сөз",
            login: "Кіру",
            logout: "Шығу →",
            wrongPassword: "Қате құпия сөз",
            adminTitle: "Тапсырмалар",
            downloadJson: "JSON жүктеу",
            uploadJson: "JSON жүктеу",
            newTask: "Жаңа тапсырма",
            editTask: "Өңдеу",
            deleteTask: "Жою",
            deleteConfirm: "Тапсырманы жоясың ба?",
            taskTitle: "Атауы",
            icon: "Таңбаша",
            description: "Сипаттама",
            taskType: "Тапсырма түрі",
            typeChoice: "Жауап таңдау — 4 нұсқа",
            typeLetters: "Сөз жинау — мәтін енгізу",
            typeSwipe: "Дұрыс / бұрыс — карточкалар",
            questionsLabel: "Сұрақтар",
            addQuestion: "+ Сұрақ қосу",
            questionNFull: "Сұрақ {n}",
            remove: "Жою",
            questionText: "Сұрақ мәтіні",
            enterQuestion: "Сұрақты енгіз",
            optionsLabel: "Нұсқалар (дұрысын белгіле)",
            variant: "Нұсқа",
            hint: "Түсініктеме (аударма, сұрақ)",
            correctWord: "Дұрыс сөз",
            statement: "Тұжырым",
            isStatementTrue: "Бұл тұжырым дұрыс па?",
            save: "Сақтау",
            saving: "Сақталуда...",
            saved: "Сақталды!",
            cancel: "Болдырмау",
            fillTitle: "Атауын енгіз",
            fillQuestionN: "{n}-сұрақты толтыр",
            minTwoOptions: "{n}-сұрақта кемінде 2 нұсқа",
            fillPromptAndWord: "Сұрақ пен сөзді толтыр №{n}",
            fillStatement: "Тұжырымды толтыр №{n}",
            importTitle: "Тапсырмаларды импорттау",
            importSub: "Файл жүктелді. Не істейміз?",
            importReplace: "Барлығын ауыстыру",
            importAppend: "Ағымдағыларға қосу",
            importing: "Импортталуда...",
            importedN: "Импортталды: {n}",
            importError: "Импорт қатесі",
            exportedInfo: "Импортталған: {n}.",
            sessionExpired: "Сессия бітті. Қайта кір.",
            chooseFileFirst: "Файл \"tasks\" массивін қамтуы керек",
            invalidJson: "Файлды оқу мүмкін болмады",
            langName: "Қазақша"
        },
        ru: {
            resetLocal: "Сбросить локальные правки",
            resetLocalConfirm: "Сбросить локальные правки? Вернётесь к tasks.json из репозитория.",
            resetLocalNothing: "Локальных правок нет.",
            tagline: "Учи казахский играя",
            heroEyebrow: "Образовательная платформа",
            heroTitle1: "Учись.",
            heroTitle2: "Практикуйся.",
            heroTitle3: "Расти.",
            heroSub: "Изучай казахский язык в формате коротких интерактивных заданий. Выбирай тему, отвечай на вопросы и смотри результат сразу.",
            statTasks: "заданий",
            statQuestions: "вопросов",
            statFree: "бесплатно",
            chooseTask: "Выбери задание",
            chooseTaskSub: "Начни с любой темы — все задания бесплатны",
            loading: "Загрузка...",
            errorLoad: "Не удалось загрузить задания.",
            noTasks: "Пока нет заданий.",
            questions: "вопросов",
            seen: "Изучено",
            done: "Пройдено",
            start: "Начать",
            cont: "Продолжить",
            repeat: "Повторить",
            back: "← Назад",
            questionN: "Вопрос {n} из {total}",
            seenN: "Изучено: {seen} / {total}",
            writeWord: "Напиши слово на казахском",
            enterWord: "Введи слово",
            check: "Проверить",
            trueOrFalse: "Верно или неверно?",
            wrongLabel: "✕ Неверно",
            rightLabel: "✓ Верно",
            checking: "Проверяем...",
            tryAgain: "Попробуй снова",
            great: "Отлично!",
            good: "Хорошо!",
            accuracy: "Точность: {n}%",
            allLearned: "Всё изучено!",
            allLearnedSub: "Ты прошёл все вопросы этого задания",
            learnedProgress: "Изучено: <b>{seen} / {total}</b> · Осталось: <b>{left}</b>",
            learnedAll: "🎉 Ты изучил все {total} вопросов! Прогресс можно сбросить и начать заново.",
            reviewHead: "Разбор ответов",
            yourAnswer: "Твой",
            correctAnswer: "Правильно",
            continueLearning: "Продолжить обучение",
            toTasks: "К заданиям",
            resetProgress: "Сбросить прогресс по этому заданию",
            startOver: "Начать сначала",
            resetConfirm: "Сбросить прогресс? Вопросы начнутся сначала.",
            toMain: "На главную",
            notFound: "Задание не найдено",
            serverError: "Ошибка сервера",
            loadError: "Ошибка загрузки",
            levelEasy: "Лёгкий",
            levelNormal: "Средний",
            levelHard: "Сложный",
            levelEmpty: "В этом уровне пока нет заданий",
            difficulty: "Сложность",
            adminLogin: "Вход в панель",
            adminLoginSub: "Введи пароль для управления заданиями",
            password: "Пароль",
            login: "Войти",
            logout: "Выйти →",
            wrongPassword: "Неверный пароль",
            adminTitle: "Задания",
            downloadJson: "Скачать JSON",
            uploadJson: "Загрузить JSON",
            newTask: "+ Новое задание",
            editTask: "Изменить",
            deleteTask: "Удалить",
            deleteConfirm: "Удалить задание?",
            taskTitle: "Название",
            icon: "Иконка",
            description: "Описание",
            taskType: "Тип задания",
            typeChoice: "Выбор ответа — 4 варианта",
            typeLetters: "Сборка слова — ввод текста",
            typeSwipe: "Верно / неверно — карточки",
            questionsLabel: "Вопросы",
            addQuestion: "+ Добавить вопрос",
            questionNFull: "Вопрос {n}",
            remove: "Удалить",
            questionText: "Текст вопроса",
            enterQuestion: "Введи вопрос",
            optionsLabel: "Варианты (отметь правильный)",
            variant: "Вариант",
            hint: "Подсказка (перевод, вопрос)",
            correctWord: "Правильное слово",
            statement: "Утверждение",
            isStatementTrue: "Это утверждение верно?",
            save: "Сохранить",
            saving: "Сохраняем...",
            saved: "Сохранено!",
            cancel: "Отмена",
            fillTitle: "Введи название",
            fillQuestionN: "Заполни вопрос №{n}",
            minTwoOptions: "В вопросе №{n} минимум 2 варианта",
            fillPromptAndWord: "Заполни вопрос и слово №{n}",
            fillStatement: "Заполни утверждение №{n}",
            importTitle: "Импорт заданий",
            importSub: "Файл загружен. Что сделать?",
            importReplace: "Заменить все задания",
            importAppend: "Добавить к текущим",
            importing: "Импортируем...",
            importedN: "Импортировано: {n}",
            importError: "Ошибка импорта",
            exportedInfo: "Импортировано: {n}.",
            sessionExpired: "Сессия истекла. Войди заново.",
            chooseFileFirst: "Файл должен содержать массив \"tasks\"",
            invalidJson: "Не удалось прочитать файл",
            langName: "Русский"
        },
        en: {
            resetLocal: "Reset local changes",
            resetLocalConfirm: "Reset local changes? You'll revert to tasks.json from the repository.",
            resetLocalNothing: "No local changes.",
            tagline: "Learn Kazakh by playing",
            heroEyebrow: "Educational platform",
            heroTitle1: "Learn.",
            heroTitle2: "Practice.",
            heroTitle3: "Grow.",
            heroSub: "Learn Kazakh through short interactive tasks. Pick a topic, answer questions, and see your results instantly.",
            statTasks: "tasks",
            statQuestions: "questions",
            statFree: "free",
            chooseTask: "Choose a task",
            chooseTaskSub: "Start with any topic — everything is free",
            loading: "Loading...",
            errorLoad: "Failed to load tasks.",
            noTasks: "No tasks yet.",
            questions: "questions",
            seen: "Learned",
            done: "Completed",
            start: "Start",
            cont: "Continue",
            repeat: "Repeat",
            back: "← Back",
            questionN: "Question {n} of {total}",
            seenN: "Learned: {seen} / {total}",
            writeWord: "Write the word in Kazakh",
            enterWord: "Enter the word",
            check: "Check",
            trueOrFalse: "True or false?",
            wrongLabel: "✕ False",
            rightLabel: "✓ True",
            checking: "Checking...",
            tryAgain: "Try again",
            great: "Great!",
            good: "Well done!",
            accuracy: "Accuracy: {n}%",
            allLearned: "All done!",
            allLearnedSub: "You have completed all questions in this task",
            learnedProgress: "Learned: <b>{seen} / {total}</b> · Left: <b>{left}</b>",
            learnedAll: "🎉 You learned all {total} questions! You can reset and start over.",
            reviewHead: "Answer review",
            yourAnswer: "Yours",
            correctAnswer: "Correct",
            continueLearning: "Continue learning",
            toTasks: "To tasks",
            resetProgress: "Reset progress for this task",
            startOver: "Start over",
            resetConfirm: "Reset progress? Questions will start from the beginning.",
            toMain: "To main",
            notFound: "Task not found",
            serverError: "Server error",
            loadError: "Loading error",
            levelEasy: "Easy",
            levelNormal: "Normal",
            levelHard: "Hard",
            levelEmpty: "No tasks in this level yet",
            difficulty: "Difficulty",
            adminLogin: "Admin login",
            adminLoginSub: "Enter password to manage tasks",
            password: "Password",
            login: "Sign in",
            logout: "Sign out →",
            wrongPassword: "Wrong password",
            adminTitle: "Tasks",
            downloadJson: "Download JSON",
            uploadJson: "Upload JSON",
            newTask: "+ New task",
            editTask: "Edit",
            deleteTask: "Delete",
            deleteConfirm: "Delete task?",
            taskTitle: "Title",
            icon: "Icon",
            description: "Description",
            taskType: "Task type",
            typeChoice: "Multiple choice — 4 options",
            typeLetters: "Word building — text input",
            typeSwipe: "True / false — cards",
            questionsLabel: "Questions",
            addQuestion: "+ Add question",
            questionNFull: "Question {n}",
            remove: "Remove",
            questionText: "Question text",
            enterQuestion: "Enter question",
            optionsLabel: "Options (mark the correct one)",
            variant: "Option",
            hint: "Hint (translation, question)",
            correctWord: "Correct word",
            statement: "Statement",
            isStatementTrue: "Is this statement true?",
            save: "Save",
            saving: "Saving...",
            saved: "Saved!",
            cancel: "Cancel",
            fillTitle: "Enter title",
            fillQuestionN: "Fill question #{n}",
            minTwoOptions: "Question #{n} needs at least 2 options",
            fillPromptAndWord: "Fill question and word #{n}",
            fillStatement: "Fill statement #{n}",
            importTitle: "Import tasks",
            importSub: "File loaded. What to do?",
            importReplace: "Replace all tasks",
            importAppend: "Add to current",
            importing: "Importing...",
            importedN: "Imported: {n}",
            importError: "Import error",
            exportedInfo: "Imported: {n}.",
            sessionExpired: "Session expired. Please sign in again.",
            chooseFileFirst: "File must contain a \"tasks\" array",
            invalidJson: "Failed to read file",
            langName: "English"
        }
    };

    const STORAGE_KEY = "qalam_lang";
    let current = "kk";

    function detect() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved && TRANSLATIONS[saved]) return saved;
        } catch (e) {}
        const browser = (navigator.language || "kk").slice(0, 2).toLowerCase();
        if (browser === "ru") return "ru";
        if (browser === "en") return "en";
        return "kk";
    }

    function t(key, vars) {
        const dict = TRANSLATIONS[current] || TRANSLATIONS.kk;
        let str = dict[key];
        if (str == null) str = TRANSLATIONS.kk[key];
        if (str == null) str = key;
        if (vars) {
            str = str.replace(/\{(\w+)\}/g, (_, k) => vars[k] != null ? vars[k] : "");
        }
        return str;
    }

    function applyToDOM() {
        document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            const raw = el.getAttribute("data-i18n-raw");
            if (raw === "html") el.innerHTML = t(key);
            else el.textContent = t(key);
        });

        document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
            el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
        });

        document.documentElement.lang = current;

        document.querySelectorAll(".lang-switch__btn").forEach((btn) => {
            btn.classList.toggle("is-active", btn.dataset.lang === current);
        });
    }

    function setLang(lang) {
        if (!TRANSLATIONS[lang]) return;
        current = lang;
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
        applyToDOM();
        document.dispatchEvent(new CustomEvent("qalam:lang", { detail: { lang } }));
    }

    function getLang() { return current; }

    function buildSwitcher() {
        const nav = document.querySelector(".lang-switch");
        if (!nav) return;
        nav.querySelectorAll(".lang-switch__btn").forEach((btn) => {
            btn.addEventListener("click", () => setLang(btn.dataset.lang));
        });
    }

    function init() {
        current = detect();
        buildSwitcher();
        applyToDOM();
    }

    window.QalamI18n = { t, setLang, getLang, apply: applyToDOM, init, TRANSLATIONS };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();   