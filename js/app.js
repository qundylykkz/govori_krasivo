/**
 * Главный модуль платформы «Говори правильно»
 * Управление состоянием, геймификация, интерактивные модули, тестирование и сертификаты.
 */

class GovoriApp {
  constructor() {
    this.data = window.AppEducationalData;
    this.sound = window.soundEffects;
    this.confetti = window.confetti;

    // Состояние пользователя
    this.state = {
      xp: parseInt(localStorage.getItem('govori_xp') || '0', 10),
      streak: parseInt(localStorage.getItem('govori_streak') || '0', 10),
      bestStreak: parseInt(localStorage.getItem('govori_best_streak') || '0', 10),
      totalCorrect: parseInt(localStorage.getItem('govori_total_correct') || '0', 10),
      unlockedAchievements: JSON.parse(localStorage.getItem('govori_achievements') || '[]'),
      moduleStats: JSON.parse(localStorage.getItem('govori_module_stats') || '{"stresses":0,"errors":0,"stylistics":0,"quizPassed":0}'),
      theoryViewed: parseInt(localStorage.getItem('govori_theory_viewed') || '0', 10),
      quizHighscore: parseInt(localStorage.getItem('govori_quiz_highscore') || '0', 10),
      studentName: localStorage.getItem('govori_student_name') || ''
    };

    // Состояния конкретных модулей
    this.currentStressIndex = 0;
    this.currentErrorIndex = 0;
    this.currentTautologyIndex = 0;

    // Состояние тестирования
    this.quiz = {
      questions: [],
      currentIndex: 0,
      score: 0,
      timerEnabled: true,
      timerSeconds: 25,
      timerInterval: null,
      userAnswers: [],
      isActive: false
    };

    this.init();
  }

  init() {
    this.updateHeaderStats();
    this.bindGlobalEvents();
    this.initStressModule();
    this.initErrorsModule();
    this.initStylisticsModule();
    this.initTheoryModule();
    this.initQuizModule();
    this.checkAchievements();
  }

  // =========================================================================
  // ГЕЙМИФИКАЦИЯ И СОСТОЯНИЕ
  // =========================================================================

  addXP(amount) {
    this.state.xp += amount;
    this.state.totalCorrect += 1;
    this.state.streak += 1;
    if (this.state.streak > this.state.bestStreak) {
      this.state.bestStreak = this.state.streak;
    }

    this.saveState();
    this.updateHeaderStats();
    this.showToast(`+${amount} XP! Твой уровень растёт!`, 'success');

    if (this.state.streak > 0 && this.state.streak % 3 === 0) {
      this.sound.playStreak();
      this.showToast(`🔥 Огненная серия: ${this.state.streak} ответов подряд!`, 'fire');
    }

    this.checkAchievements();
  }

  resetStreak() {
    if (this.state.streak >= 3) {
      this.showToast(`Серия ${this.state.streak} прервалась, но не унывай!`, 'info');
    }
    this.state.streak = 0;
    this.saveState();
    this.updateHeaderStats();
  }

  saveState() {
    localStorage.setItem('govori_xp', this.state.xp);
    localStorage.setItem('govori_streak', this.state.streak);
    localStorage.setItem('govori_best_streak', this.state.bestStreak);
    localStorage.setItem('govori_total_correct', this.state.totalCorrect);
    localStorage.setItem('govori_achievements', JSON.stringify(this.state.unlockedAchievements));
    localStorage.setItem('govori_module_stats', JSON.stringify(this.state.moduleStats));
    localStorage.setItem('govori_theory_viewed', this.state.theoryViewed);
    localStorage.setItem('govori_quiz_highscore', this.state.quizHighscore);
    localStorage.setItem('govori_student_name', this.state.studentName);
  }

  updateHeaderStats() {
    const xpEl = document.getElementById('user-xp-count');
    const streakEl = document.getElementById('user-streak-count');
    if (xpEl) xpEl.textContent = `${this.state.xp} XP`;
    if (streakEl) streakEl.textContent = this.state.streak;
  }

  checkAchievements() {
    if (!this.data.achievements) return;
    this.data.achievements.forEach(ach => {
      if (!this.state.unlockedAchievements.includes(ach.id)) {
        if (ach.condition(this.state)) {
          this.state.unlockedAchievements.push(ach.id);
          this.saveState();
          this.sound.playFanfare();
          this.confetti.burst(window.innerWidth / 2, window.innerHeight / 3, 70);
          this.showToast(`🏆 Открыто достижение: «${ach.title}»!`, 'achievement');
        }
      }
    });
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    let icon = '💡';
    if (type === 'success') icon = '⭐';
    if (type === 'fire') icon = '🔥';
    if (type === 'achievement') icon = '🏆';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // =========================================================================
  // НАВИГАЦИЯ И ГЛОБАЛЬНЫЕ СОБЫТИЯ
  // =========================================================================

  bindGlobalEvents() {
    // Звук переключатель
    const soundBtn = document.getElementById('sound-toggle-btn');
    if (soundBtn) {
      const updateIcon = () => {
        soundBtn.innerHTML = this.sound.isMuted ? '🔇' : '🔔';
        soundBtn.title = this.sound.isMuted ? 'Включить звук' : 'Выключить звук';
      };
      updateIcon();
      soundBtn.addEventListener('click', () => {
        this.sound.toggleMute();
        updateIcon();
        this.sound.playClick();
      });
    }

    // Мобильное меню
    const burgerBtn = document.getElementById('burger-btn');
    const mainNav = document.getElementById('main-nav');
    if (burgerBtn && mainNav) {
      burgerBtn.addEventListener('click', () => {
        mainNav.classList.toggle('open');
      });
      document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => mainNav.classList.remove('open'));
      });
    }

    // Модальное окно ачивок
    const openAchBtn = document.getElementById('open-achievements-btn');
    const modal = document.getElementById('achievements-modal');
    const closeBtn = document.getElementById('close-ach-modal');
    if (openAchBtn && modal) {
      openAchBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.renderAchievementsModal();
        modal.classList.add('open');
      });
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    // Подсветка навигации при скролле
    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset;
      sections.forEach(section => {
        const sectionHeight = section.offsetHeight;
        const sectionTop = section.offsetTop - 100;
        const sectionId = section.getAttribute('id');
        const navItem = document.querySelector(`.nav-link[href="#${sectionId}"]`);
        if (navItem) {
          if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
            navItem.classList.add('active');
          } else {
            navItem.classList.remove('active');
          }
        }
      });
    });
  }

  renderAchievementsModal() {
    const list = document.getElementById('achievements-list');
    if (!list) return;

    list.innerHTML = '';
    this.data.achievements.forEach(ach => {
      const isUnlocked = this.state.unlockedAchievements.includes(ach.id);
      const card = document.createElement('div');
      card.className = `achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`;
      card.innerHTML = `
        <div class="ach-icon">${ach.icon}</div>
        <div class="ach-info">
          <h4>${ach.title} ${isUnlocked ? '✅' : '🔒'}</h4>
          <p>${ach.description}</p>
        </div>
      `;
      list.appendChild(card);
    });
  }

  // =========================================================================
  // МОДУЛЬ 1: УДАРЕНИЕ ДНЯ
  // =========================================================================

  initStressModule() {
    this.renderStressWord();

    const nextBtn = document.getElementById('stress-next-btn');
    const prevBtn = document.getElementById('stress-prev-btn');
    const randomBtn = document.getElementById('stress-random-btn');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.currentStressIndex = (this.currentStressIndex + 1) % this.data.stresses.length;
        this.renderStressWord();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.currentStressIndex = (this.currentStressIndex - 1 + this.data.stresses.length) % this.data.stresses.length;
        this.renderStressWord();
      });
    }

    if (randomBtn) {
      randomBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.currentStressIndex = Math.floor(Math.random() * this.data.stresses.length);
        this.renderStressWord();
      });
    }
  }

  renderStressWord() {
    const current = this.data.stresses[this.currentStressIndex];
    if (!current) return;

    const progressEl = document.getElementById('stress-progress');
    const displayEl = document.getElementById('stress-word-display');
    const categoryEl = document.getElementById('stress-category-badge');
    const explanationBox = document.getElementById('stress-explanation-box');
    const mnemonicText = document.getElementById('stress-mnemonic-text');
    const ruleText = document.getElementById('stress-rule-text');

    if (progressEl) progressEl.textContent = `Слово ${this.currentStressIndex + 1} из ${this.data.stresses.length}`;
    if (categoryEl) categoryEl.textContent = current.category;
    if (explanationBox) explanationBox.style.display = 'none';

    displayEl.innerHTML = '';

    const vowels = 'аеёиоуыэюяАЕЁИОУЫЭЮЯ';
    const letters = current.word.split('');

    letters.forEach((char, index) => {
      const isVowel = vowels.includes(char.toLowerCase());
      const btn = document.createElement('button');
      btn.className = `letter-btn ${isVowel ? 'vowel' : 'consonant'}`;
      btn.textContent = char;
      btn.dataset.index = index;

      if (isVowel) {
        btn.addEventListener('click', () => this.handleVowelClick(btn, index, current));
      }
      displayEl.appendChild(btn);
    });

    if (mnemonicText) mnemonicText.textContent = current.mnemonic;
    if (ruleText) ruleText.textContent = current.rule;
  }

  handleVowelClick(btn, clickedIndex, wordData) {
    if (btn.classList.contains('correct') || btn.classList.contains('wrong')) return;

    const isCorrect = (clickedIndex === wordData.correctIndex);

    if (isCorrect) {
      btn.classList.add('correct');
      this.sound.playCorrect();

      // Конфетти прямо из позиции кнопки
      const rect = btn.getBoundingClientRect();
      this.confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 45);

      this.state.moduleStats.stresses = (this.state.moduleStats.stresses || 0) + 1;
      this.addXP(15);

      const explanationBox = document.getElementById('stress-explanation-box');
      if (explanationBox) explanationBox.style.display = 'block';

      // Блокируем остальные гласные
      document.querySelectorAll('#stress-word-display .vowel').forEach(b => {
        if (b !== btn) b.disabled = true;
      });
    } else {
      btn.classList.add('wrong');
      this.sound.playWrong();
      this.resetStreak();

      setTimeout(() => {
        btn.classList.remove('wrong');
      }, 700);
    }
  }

  // =========================================================================
  // МОДУЛЬ 2: НАЙДИ ОШИБКУ
  // =========================================================================

  initErrorsModule() {
    this.renderErrorQuestion();

    const nextBtn = document.getElementById('error-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.currentErrorIndex = (this.currentErrorIndex + 1) % this.data.findErrors.length;
        this.renderErrorQuestion();
      });
    }
  }

  renderErrorQuestion() {
    const item = this.data.findErrors[this.currentErrorIndex];
    if (!item) return;

    const topicBadge = document.getElementById('error-topic-badge');
    const taskTitle = document.getElementById('error-question-title');
    const optionsContainer = document.getElementById('error-options-grid');
    const explanationCard = document.getElementById('error-explanation-card');
    const ruleTitle = document.getElementById('error-rule-title');
    const ruleText = document.getElementById('error-rule-text');
    const nextBtn = document.getElementById('error-next-btn');
    const counterEl = document.getElementById('error-progress-counter');

    if (topicBadge) topicBadge.textContent = item.topic;
    if (taskTitle) taskTitle.textContent = item.task;
    if (counterEl) counterEl.textContent = `Задание ${this.currentErrorIndex + 1} из ${this.data.findErrors.length}`;
    if (explanationCard) explanationCard.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';

    optionsContainer.innerHTML = '';

    item.options.forEach((opt, idx) => {
      const card = document.createElement('div');
      card.className = 'option-card';
      card.innerHTML = `
        <span class="option-text">${opt.text}</span>
        <div class="option-status-icon">✓</div>
      `;

      card.addEventListener('click', () => {
        if (optionsContainer.classList.contains('answered')) return;
        optionsContainer.classList.add('answered');

        if (opt.isCorrect) {
          card.classList.add('correct');
          this.sound.playCorrect();
          const rect = card.getBoundingClientRect();
          this.confetti.burst(rect.left + rect.width / 2, rect.top + rect.height / 2, 40);
          this.state.moduleStats.errors = (this.state.moduleStats.errors || 0) + 1;
          this.addXP(20);
        } else {
          card.classList.add('wrong');
          card.querySelector('.option-status-icon').textContent = '✗';
          this.sound.playWrong();
          this.resetStreak();

          // Подсветить верный вариант
          document.querySelectorAll('#error-options-grid .option-card').forEach((c, i) => {
            if (item.options[i].isCorrect) {
              c.classList.add('correct');
            }
          });
        }

        // Показать детальное правило
        if (ruleTitle) ruleTitle.textContent = item.ruleTitle;
        if (ruleText) ruleText.innerHTML = item.explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (explanationCard) explanationCard.style.display = 'block';
        if (nextBtn) nextBtn.style.display = 'inline-flex';
      });

      optionsContainer.appendChild(card);
    });

    optionsContainer.classList.remove('answered');
  }

  // =========================================================================
  // МОДУЛЬ 3: СКАЖИ КРАСИВО (Стилистика)
  // =========================================================================

  initStylisticsModule() {
    this.renderTautologies();
    this.renderReplacements();

    const tabs = document.querySelectorAll('.module-tabs .tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.sound.playClick();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const target = tab.dataset.tab;
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(target);
        if (pane) pane.classList.add('active');
      });
    });
  }

  renderTautologies() {
    const container = document.getElementById('tautology-cards-grid');
    if (!container) return;
    container.innerHTML = '';

    this.data.stylistics.tautologies.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'style-card';
      card.innerHTML = `
        <span class="style-card-badge badge-amber">${item.type}</span>
        <div class="style-comparison">
          <div class="compare-row compare-wrong">
            <span>❌</span>
            <span class="phrase-text">${item.phrase}</span>
          </div>
          <div class="compare-row compare-right">
            <span>✨</span>
            <span class="phrase-text">${item.corrected}</span>
          </div>
        </div>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 12px;">
          ${item.explanation}
        </p>
        <div class="style-card-action">
          <button class="btn btn-secondary fix-phrase-btn" style="width: 100%; font-size: 0.88rem; padding: 10px;">
            Убрать лишнее «${item.redundantPart}» (+10 XP)
          </button>
        </div>
      `;

      const btn = card.querySelector('.fix-phrase-btn');
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.innerHTML = 'Запомнил! Молодец ✅';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-secondary');
        this.sound.playCorrect();
        this.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 25);
        this.state.moduleStats.stylistics = (this.state.moduleStats.stylistics || 0) + 1;
        this.addXP(10);
      });

      container.appendChild(card);
    });
  }

  renderReplacements() {
    const container = document.getElementById('replacements-cards-grid');
    if (!container) return;
    container.innerHTML = '';

    this.data.stylistics.replacements.forEach(item => {
      const card = document.createElement('div');
      card.className = 'style-card';
      card.innerHTML = `
        <span class="style-card-badge badge-blue">Канцеляризмы и паразиты</span>
        <div class="style-comparison">
          <div class="compare-row compare-wrong">
            <span>⛔</span>
            <span class="phrase-text">${item.awkward}</span>
          </div>
          <div class="compare-row compare-right">
            <span>🌟</span>
            <span class="phrase-text">${item.better}</span>
          </div>
        </div>
        <p style="font-size: 0.88rem; color: var(--text-muted); margin-bottom: 8px;">
          <strong>Контекст:</strong> ${item.cleanExample}
        </p>
        <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 12px;">
          ${item.tip}
        </p>
        <div class="style-card-action">
          <button class="btn btn-secondary replace-practice-btn" style="width: 100%; font-size: 0.88rem; padding: 10px;">
            Говорить лаконично (+10 XP)
          </button>
        </div>
      `;

      const btn = card.querySelector('.replace-practice-btn');
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.innerHTML = 'Красивая речь освоена! 👏';
        btn.classList.add('btn-success');
        btn.classList.remove('btn-secondary');
        this.sound.playCorrect();
        this.state.moduleStats.stylistics = (this.state.moduleStats.stylistics || 0) + 1;
        this.addXP(10);
      });

      container.appendChild(card);
    });
  }

  // =========================================================================
  // МОДУЛЬ 4: ПРОВЕРЬ СЕБЯ (Тест и Сертификат)
  // =========================================================================

  initQuizModule() {
    const startBtn = document.getElementById('quiz-start-btn');
    const timerToggle = document.getElementById('quiz-timer-toggle');

    if (timerToggle) {
      timerToggle.addEventListener('change', (e) => {
        this.quiz.timerEnabled = e.target.checked;
      });
    }

    if (startBtn) {
      startBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.startQuiz();
      });
    }

    const nextQuestionBtn = document.getElementById('quiz-next-q-btn');
    if (nextQuestionBtn) {
      nextQuestionBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.quiz.currentIndex += 1;
        if (this.quiz.currentIndex < this.quiz.questions.length) {
          this.renderQuizQuestion();
        } else {
          this.finishQuiz();
        }
      });
    }

    const restartBtn = document.getElementById('quiz-restart-btn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => {
        this.sound.playClick();
        this.startQuiz();
      });
    }

    // Обработка имени для сертификата
    const certInput = document.getElementById('cert-student-name-input');
    const certUpdateBtn = document.getElementById('cert-update-name-btn');
    const printBtn = document.getElementById('cert-print-btn');
    const downloadBtn = document.getElementById('cert-download-btn');

    if (certInput) {
      certInput.value = this.state.studentName;
      certInput.addEventListener('input', (e) => {
        this.updateCertificateName(e.target.value.trim());
      });
    }

    if (certUpdateBtn && certInput) {
      certUpdateBtn.addEventListener('click', () => {
        this.sound.playClick();
        const val = certInput.value.trim();
        if (val) {
          this.state.studentName = val;
          this.saveState();
          this.updateCertificateName(val);
          this.showToast('Имя сохранено в сертификате!', 'success');
        }
      });
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => {
        window.print();
      });
    }

    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        this.downloadCertificateImage();
      });
    }
  }

  startQuiz() {
    // Выбираем 10 вопросов
    const shuffled = [...this.data.quizQuestions].sort(() => 0.5 - Math.random());
    this.quiz.questions = shuffled.slice(0, 10);
    this.quiz.currentIndex = 0;
    this.quiz.score = 0;
    this.quiz.userAnswers = [];
    this.quiz.isActive = true;

    document.getElementById('quiz-intro-box').style.display = 'none';
    document.getElementById('quiz-results-box').style.display = 'none';
    document.getElementById('quiz-active-view').style.display = 'block';

    this.renderQuizQuestion();
  }

  renderQuizQuestion() {
    clearInterval(this.quiz.timerInterval);

    const q = this.quiz.questions[this.quiz.currentIndex];
    const total = this.quiz.questions.length;

    // Прогресс
    const countEl = document.getElementById('quiz-question-counter');
    const fillEl = document.getElementById('quiz-progress-fill');
    const timerBadge = document.getElementById('quiz-timer-badge');
    const nextBtn = document.getElementById('quiz-next-q-btn');
    const feedbackBox = document.getElementById('quiz-answer-feedback');

    if (countEl) countEl.textContent = `Вопрос ${this.quiz.currentIndex + 1} из ${total}`;
    if (fillEl) fillEl.style.width = `${((this.quiz.currentIndex) / total) * 100}%`;
    if (nextBtn) nextBtn.style.display = 'none';
    if (feedbackBox) feedbackBox.style.display = 'none';

    // Текст вопроса и категория
    const catBadge = document.getElementById('quiz-q-category');
    const qText = document.getElementById('quiz-q-text');
    if (catBadge) catBadge.textContent = q.category;
    if (qText) qText.textContent = q.question;

    // Варианты ответов
    const optionsList = document.getElementById('quiz-options-list');
    optionsList.innerHTML = '';

    q.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-option-btn';
      btn.innerHTML = `
        <span>${optText}</span>
        <span class="quiz-check-mark"></span>
      `;

      btn.addEventListener('click', () => {
        this.handleQuizAnswer(idx, q);
      });

      optionsList.appendChild(btn);
    });

    // Таймер
    if (this.quiz.timerEnabled) {
      timerBadge.style.display = 'inline-flex';
      let remaining = this.quiz.timerSeconds;
      timerBadge.classList.remove('warning');
      timerBadge.innerHTML = `⏱️ ${remaining} сек`;

      this.quiz.timerInterval = setInterval(() => {
        remaining -= 1;
        timerBadge.innerHTML = `⏱️ ${remaining} сек`;

        if (remaining <= 5) {
          timerBadge.classList.add('warning');
        }

        if (remaining <= 0) {
          clearInterval(this.quiz.timerInterval);
          this.handleQuizAnswer(-1, q, true); // Time expired
        }
      }, 1000);
    } else {
      timerBadge.style.display = 'none';
    }
  }

  handleQuizAnswer(selectedIndex, questionObj, isTimeout = false) {
    clearInterval(this.quiz.timerInterval);

    const isCorrect = (selectedIndex === questionObj.correctIndex);
    const optionsButtons = document.querySelectorAll('#quiz-options-list .quiz-option-btn');

    optionsButtons.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === questionObj.correctIndex) {
        btn.classList.add('selected-correct');
        btn.querySelector('.quiz-check-mark').textContent = '✓';
      }
      if (idx === selectedIndex && !isCorrect) {
        btn.classList.add('selected-wrong');
        btn.querySelector('.quiz-check-mark').textContent = '✗';
      }
    });

    if (isCorrect) {
      this.quiz.score += 1;
      this.sound.playCorrect();
      this.confetti.burst(window.innerWidth / 2, window.innerHeight / 2, 35);
      this.addXP(25);
    } else {
      this.sound.playWrong();
      this.resetStreak();
    }

    this.quiz.userAnswers.push({
      question: questionObj.question,
      selected: selectedIndex >= 0 ? questionObj.options[selectedIndex] : 'Время вышло',
      correct: questionObj.options[questionObj.correctIndex],
      isCorrect: isCorrect,
      explanation: questionObj.explanation
    });

    const feedbackBox = document.getElementById('quiz-answer-feedback');
    if (feedbackBox) {
      feedbackBox.innerHTML = `
        <strong>${isCorrect ? 'Верно! Отличный выбор!' : (isTimeout ? '⏰ Время вышло!' : 'Не совсем точно.')}</strong>
        <p style="margin-top: 4px; font-size: 0.92rem;">${questionObj.explanation}</p>
      `;
      feedbackBox.style.display = 'block';
    }

    const nextBtn = document.getElementById('quiz-next-q-btn');
    if (nextBtn) {
      nextBtn.style.display = 'inline-flex';
      nextBtn.textContent = (this.quiz.currentIndex + 1 === this.quiz.questions.length) ? 'Посмотреть результаты 🎉' : 'Следующий вопрос ➔';
    }
  }

  finishQuiz() {
    this.quiz.isActive = false;
    document.getElementById('quiz-active-view').style.display = 'none';
    const resultsBox = document.getElementById('quiz-results-box');
    resultsBox.style.display = 'block';

    const total = this.quiz.questions.length;
    const pct = Math.round((this.quiz.score / total) * 100);

    // Звуки победы и конфетти
    this.sound.playFanfare();
    this.confetti.burst(window.innerWidth / 2, window.innerHeight / 3, 100);

    if (pct > this.state.quizHighscore) {
      this.state.quizHighscore = pct;
    }
    this.state.moduleStats.quizPassed = (this.state.moduleStats.quizPassed || 0) + 1;
    this.saveState();
    this.checkAchievements();

    // Заполнение экрана результатов
    document.getElementById('result-pct-number').textContent = `${pct}%`;

    let rankTitle = 'Любознательный ученик';
    let feedback = 'Хорошая попытка! Повтори правила в справочнике и попробуй ещё раз — результат будет выше!';

    if (pct >= 90) {
      rankTitle = '🏆 Магистр русской речи';
      feedback = 'Потрясающий результат! Ты безупречно владеешь нормами языка, ударениями и стилистикой!';
    } else if (pct >= 70) {
      rankTitle = '🥇 Знаток русского языка';
      feedback = 'Отличные знания! Твоя речь грамотна, уверенна и выразительна!';
    } else if (pct >= 50) {
      rankTitle = '🥈 Уверенный практик';
      feedback = 'Неплохой уровень! Ещё немного практики с ударениями и паронимами — и ты станешь мастером!';
    }

    document.getElementById('result-rank-title').textContent = rankTitle;
    document.getElementById('result-feedback-text').textContent = feedback;

    // Обновление сертификата
    const name = this.state.studentName || 'Ученик';
    this.updateCertificateName(name, rankTitle, pct);
  }

  updateCertificateName(name, rank = 'Знаток русского языка', pct = 100) {
    const certNameEl = document.getElementById('cert-display-name');
    const certDateEl = document.getElementById('cert-display-date');
    const certScoreEl = document.getElementById('cert-display-score');

    if (certNameEl) certNameEl.textContent = name || 'Ученик школы';
    if (certDateEl) {
      const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
      certDateEl.textContent = `Дата выдачи: ${today}`;
    }
    if (certScoreEl) certScoreEl.textContent = `Успеваемость: ${pct}% | Статус: ${rank}`;
  }

  downloadCertificateImage() {
    const cert = document.getElementById('digital-certificate-card');
    if (!cert) return;

    // Генерируем красивую картинку через HTML5 Canvas
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');

    // Фон сертификата
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рамки
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 14;
    ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, canvas.width - 96, canvas.height - 96);

    // Заголовок
    ctx.fillStyle = '#64748B';
    ctx.font = '700 24px Montserrat, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ШКОЛЬНАЯ ОБРАЗОВАТЕЛЬНАЯ ПЛАТФОРМА «ГОВОРИ ПРАВИЛЬНО»', canvas.width / 2, 120);

    ctx.fillStyle = '#0F172A';
    ctx.font = '900 52px Montserrat, sans-serif';
    ctx.fillText('СЕРТИФИКАТ ГРАМОТНОСТИ', canvas.width / 2, 200);

    ctx.fillStyle = '#475569';
    ctx.font = '500 24px Nunito, sans-serif';
    ctx.fillText('Настоящий сертификат подтверждает, что', canvas.width / 2, 260);

    // Имя ученика
    const name = this.state.studentName || 'Ученик';
    ctx.fillStyle = '#2563EB';
    ctx.font = '800 48px Montserrat, sans-serif';
    ctx.fillText(name, canvas.width / 2, 340);

    // Разделительная линия
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(300, 370);
    ctx.lineTo(900, 370);
    ctx.stroke();

    // Описание
    ctx.fillStyle = '#334155';
    ctx.font = '600 26px Nunito, sans-serif';
    ctx.fillText('успешно прошёл комплексное тестирование по культуре речи,', canvas.width / 2, 430);
    ctx.fillText('орфоэпическим нормам и грамматике русского языка.', canvas.width / 2, 470);

    // Печать и медаль
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(canvas.width / 2, 570, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 36px sans-serif';
    ctx.fillText('★', canvas.width / 2, 582);

    // Футер с датой
    const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillStyle = '#64748B';
    ctx.font = '600 20px Nunito, sans-serif';
    ctx.fillText(`Дата выдачи: ${today} г.`, 220, 710);
    ctx.fillText('Проверено системой «Говори правильно»', 960, 710);

    // Скачивание файла
    const a = document.createElement('a');
    a.download = `Сертификат_${name || 'Говори_Правильно'}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    this.sound.playCorrect();
    this.showToast('Сертификат успешно сохранён в формате PNG!', 'success');
  }

  // =========================================================================
  // МОДУЛЬ 5: ТЕОРИЯ И ПРАВИЛА
  // =========================================================================

  initTheoryModule() {
    this.renderTheoryCards(this.data.theoryRules);

    const searchInput = document.getElementById('theory-search-input');
    const pills = document.querySelectorAll('.theory-category-pills .cat-pill');

    let currentCategory = 'Все';
    let searchQuery = '';

    const filterRules = () => {
      let filtered = this.data.theoryRules;

      if (currentCategory !== 'Все') {
        filtered = filtered.filter(r => r.category.toLowerCase() === currentCategory.toLowerCase());
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(r =>
          r.title.toLowerCase().includes(q) ||
          r.summary.toLowerCase().includes(q) ||
          r.mnemonic.toLowerCase().includes(q) ||
          r.fullText.toLowerCase().includes(q)
        );
      }

      this.renderTheoryCards(filtered);
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim();
        filterRules();
      });
    }

    pills.forEach(pill => {
      pill.addEventListener('click', () => {
        this.sound.playClick();
        pills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        currentCategory = pill.dataset.cat;
        filterRules();
      });
    });
  }

  renderTheoryCards(rules) {
    const grid = document.getElementById('theory-rules-grid');
    if (!grid) return;
    grid.innerHTML = '';

    if (rules.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
          🔍 По вашему запросу ничего не найдено. Попробуйте изменить формулировку!
        </div>
      `;
      return;
    }

    rules.forEach(rule => {
      const card = document.createElement('div');
      card.className = 'rule-card';
      card.innerHTML = `
        <div>
          <span class="rule-card-badge">${rule.category} • ${rule.badge}</span>
          <h3 class="rule-card-title">${rule.title}</h3>
          <p class="rule-card-summary">${rule.summary}</p>
          <div class="rule-card-mnemonic">
            🎵 ${rule.mnemonic}
          </div>
          <div class="rule-full-text" style="display: none; font-size: 0.94rem; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.55;">
            ${rule.fullText.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}
          </div>
        </div>
        <div style="display: flex; gap: 8px; margin-top: 14px;">
          <button class="btn btn-secondary toggle-full-rule-btn" style="flex: 1; font-size: 0.85rem; padding: 10px;">
            Подробнее ▾
          </button>
          <button class="btn btn-primary rule-learned-btn" style="font-size: 0.85rem; padding: 10px 16px;">
            Понятно (+5 XP)
          </button>
        </div>
      `;

      const toggleBtn = card.querySelector('.toggle-full-rule-btn');
      const fullTextDiv = card.querySelector('.rule-full-text');
      toggleBtn.addEventListener('click', () => {
        this.sound.playClick();
        const isOpen = fullTextDiv.style.display === 'block';
        fullTextDiv.style.display = isOpen ? 'none' : 'block';
        toggleBtn.textContent = isOpen ? 'Подробнее ▾' : 'Свернуть ▴';
      });

      const learnedBtn = card.querySelector('.rule-learned-btn');
      learnedBtn.addEventListener('click', () => {
        if (learnedBtn.disabled) return;
        learnedBtn.disabled = true;
        learnedBtn.classList.remove('btn-primary');
        learnedBtn.classList.add('btn-success');
        learnedBtn.textContent = 'Изучено ✅';
        this.sound.playCorrect();
        this.state.theoryViewed = (this.state.theoryViewed || 0) + 1;
        this.addXP(5);
      });

      grid.appendChild(card);
    });
  }
}

// Запуск приложения при загрузке документа
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.govoriApp = new GovoriApp();
  });
} else {
  window.govoriApp = new GovoriApp();
}

