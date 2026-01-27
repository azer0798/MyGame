// ============================================
// النظام الأساسي للعبة
// ============================================

class ArabicMatchGame {
    constructor() {
        this.init();
    }

    async init() {
        // تهيئة المتغيرات الأساسية
        this.setupVariables();
        
        // تحميل البيانات المحفوظة
        await this.loadGameData();
        
        // إعداد النظام الصوتي
        this.setupAudio();
        
        // إعداد واجهة المستخدم
        this.setupUI();
        
        // بدء اللعبة
        this.startLoading();
    }

    setupVariables() {
        // إعدادات اللعبة
        this.config = {
            boardSize: 7,
            initialMoves: 25,
            targetScore: 1000,
            matchPoints: 100,
            comboMultiplier: 1.5,
            maxCombo: 5,
            powerupCosts: {
                shuffle: 75,
                hammer: 50,
                bomb: 100,
                hint: 30
            }
        };

        // حالة اللعبة
        this.gameState = {
            currentLevel: 1,
            totalScore: 0,
            totalCoins: 500,
            playerXP: 0,
            maxLevel: 1,
            dailyStreak: 1,
            lastPlayDate: null,
            settings: {
                music: true,
                sound: true,
                vibration: true
            }
        };

        // حالة المستوى الحالي
        this.levelState = {
            movesLeft: 25,
            currentScore: 0,
            selectedCell: null,
            board: [],
            matches: [],
            combo: 1,
            gameActive: false,
            goals: [],
            powerups: {},
            collectedItems: {}
        };

        // أنظمة اللعبة
        this.levels = this.generateLevels(100);
        this.icons = this.generateIcons();
        this.powerups = this.generatePowerups();
        this.achievements = this.generateAchievements();
        this.dailyQuests = this.generateDailyQuests();
    }

    // ============================================
    // نظام التخزين والمزامنة
    // ============================================
    async loadGameData() {
        try {
            const savedData = localStorage.getItem('arabicMatchPro');
            if (savedData) {
                const data = JSON.parse(savedData);
                Object.assign(this.gameState, data);
                
                // التحقق من المهام اليومية
                this.checkDailyReset();
                
                // تحديث أعلى مستوى مفتوح
                if (this.gameState.currentLevel > this.gameState.maxLevel) {
                    this.gameState.maxLevel = this.gameState.currentLevel;
                }
            }
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
        }
    }

    async saveGameData() {
        try {
            this.gameState.lastPlayDate = new Date().toISOString();
            localStorage.setItem('arabicMatchPro', JSON.stringify(this.gameState));
            
            // محاولة المزامنة مع السحابة (إذا أضيف تسجيل دخول)
            if (typeof window.syncWithCloud === 'function') {
                await window.syncWithCloud(this.gameState);
            }
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
        }
    }

    checkDailyReset() {
        const today = new Date().toDateString();
        const lastPlay = this.gameState.lastPlayDate ? 
            new Date(this.gameState.lastPlayDate).toDateString() : null;
        
        if (lastPlay !== today) {
            // إعادة تعيين المهام اليومية
            this.dailyQuests = this.generateDailyQuests();
            
            // زيادة السلسلة اليومية
            if (lastPlay && this.isConsecutiveDay(lastPlay, today)) {
                this.gameState.dailyStreak++;
            } else {
                this.gameState.dailyStreak = 1;
            }
        }
    }

    isConsecutiveDay(last, current) {
        const lastDate = new Date(last);
        const currentDate = new Date(current);
        const diffTime = Math.abs(currentDate - lastDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays === 1;
    }

    // ============================================
    // نظام المستويات
    // ============================================
    generateLevels(count) {
        const levels = [];
        const themes = [
            { name: 'سوق المدينة', color: '#ff9a00', bg: 'market' },
            { name: 'واحة النخيل', color: '#00b09b', bg: 'oasis' },
            { name: 'ليلة الهلال', color: '#667eea', bg: 'night' },
            { name: 'قصر السلطان', color: '#764ba2', bg: 'palace' },
            { name: 'سفينة الصحراء', color: '#f093fb', bg: 'desert' }
        ];

        for (let i = 1; i <= count; i++) {
            const theme = themes[i % themes.length];
            const difficulty = Math.min(10, Math.ceil(i / 10));
            
            levels.push({
                id: i,
                name: `${theme.name} ${Math.ceil(i / 5)}`,
                theme: theme,
                difficulty: difficulty,
                moves: Math.max(15, 30 - difficulty * 2),
                targetScore: 1000 + (i - 1) * 200,
                goals: this.generateLevelGoals(i),
                obstacles: this.generateObstacles(i),
                rewards: this.generateLevelRewards(i),
                unlockRequirements: i === 1 ? null : {
                    minLevel: i - 1,
                    minScore: (i - 1) * 500
                }
            });
        }
        
        return levels;
    }

    generateLevelGoals(level) {
        const goals = [];
        const baseCount = 15 + Math.floor(level / 3);
        
        // هدف جمع الأيقونات
        const iconTypes = ['coffee', 'palm', 'moon', 'mosque', 'camel', 'lantern'];
        const selectedIcons = this.getRandomItems(iconTypes, 2);
        
        selectedIcons.forEach(icon => {
            goals.push({
                type: 'collect',
                icon: icon,
                target: baseCount + Math.floor(level / 2),
                current: 0
            });
        });
        
        // هدف النقاط
        goals.push({
            type: 'score',
            target: 1000 + (level - 1) * 200,
            current: 0
        });
        
        // هدف التتابع (للمستويات المتقدمة)
        if (level > 5) {
            goals.push({
                type: 'combo',
                target: 3,
                current: 0
            });
        }
        
        return goals;
    }

    generateObstacles(level) {
        const obstacles = [];
        if (level > 3) obstacles.push('ice');
        if (level > 6) obstacles.push('lock');
        if (level > 9) obstacles.push('stone');
        return obstacles;
    }

    generateLevelRewards(level) {
        return {
            coins: 50 + (level * 10),
            xp: 20 + (level * 5),
            powerups: this.getRandomPowerups(level)
        };
    }

    // ============================================
    // نظام الأيقونات والعناصر
    // ============================================
    generateIcons() {
        return [
            { type: 'coffee', emoji: '☕', color: '#e67e22', bg: 'coffee-bg' },
            { type: 'palm', emoji: '🌴', color: '#27ae60', bg: 'palm-bg' },
            { type: 'moon', emoji: '🌙', color: '#3498db', bg: 'moon-bg' },
            { type: 'mosque', emoji: '🕌', color: '#f1c40f', bg: 'mosque-bg' },
            { type: 'camel', emoji: '🐪', color: '#8e44ad', bg: 'camel-bg' },
            { type: 'lantern', emoji: '🪔', color: '#e74c3c', bg: 'lantern-bg' },
            { type: 'book', emoji: '📖', color: '#1abc9c', bg: 'book-bg' },
            { type: 'oud', emoji: '🎻', color: '#d35400', bg: 'oud-bg' }
        ];
    }

    generatePowerups() {
        return {
            shuffle: {
                name: 'إعادة ترتيب',
                emoji: '🔀',
                description: 'يعيد ترتيب كل الأيقونات',
                cost: 75,
                maxCount: 3
            },
            hammer: {
                name: 'المطرقة',
                emoji: '🔨',
                description: 'يزيل أي أيقونة',
                cost: 50,
                maxCount: 5
            },
            bomb: {
                name: 'القنبلة',
                emoji: '💣',
                description: 'ينفجر في دائرة نصف قطرها 2',
                cost: 100,
                maxCount: 2
            },
            hint: {
                name: 'تلميح',
                emoji: '💡',
                description: 'يظهر أفضل حركة',
                cost: 30,
                maxCount: 10
            },
            extraMoves: {
                name: 'حركات إضافية',
                emoji: '➕',
                description: '+5 حركات إضافية',
                cost: 150,
                maxCount: 1
            }
        };
    }

    // ============================================
    // نظام الإنجازات والمهام
    // ============================================
    generateAchievements() {
        return [
            { id: 'first_win', name: 'الفوز الأول', emoji: '🥇', description: 'فوز بالمستوى الأول', reward: 100 },
            { id: 'combo_master', name: 'سيد التتابع', emoji: '⚡', description: 'حقق 5x كومبو', reward: 200 },
            { id: 'collector', name: 'الجامع', emoji: '📦', description: 'اجمع 1000 أيقونة', reward: 300 },
            { id: 'streak_7', name: 'مثابرة', emoji: '🔥', description: '7 أيام متتالية', reward: 500 },
            { id: 'level_50', name: 'المحترف', emoji: '👑', description: 'أكمل 50 مستوى', reward: 1000 }
        ];
    }

    generateDailyQuests() {
        return [
            { id: 'play_3', description: 'العب 3 مستويات', target: 3, current: 0, reward: 50, emoji: '🎮' },
            { id: 'match_100', description: 'حقق 100 مطابقة', target: 100, current: 0, reward: 100, emoji: '✨' },
            { id: 'score_5000', description: 'احصل على 5000 نقطة', target: 5000, current: 0, reward: 150, emoji: '⭐' }
        ];
    }

    // ============================================
    // نظام الصوتيات
    // ============================================
    setupAudio() {
        this.audio = {
            context: null,
            sounds: {},
            music: null
        };

        // تهيئة AudioContext
        if (typeof AudioContext !== 'undefined') {
            this.audio.context = new (AudioContext || webkitAudioContext)();
        }

        // تحميل الأصوات
        this.loadSounds();
    }

    loadSounds() {
        // أصوات أساسية
        this.audio.sounds = {
            select: this.createSound(523.25, 'sine', 0.1),
            swap: this.createSound(659.25, 'sine', 0.2),
            match: this.createSound(783.99, 'sine', 0.3),
            powerup: this.createSound(1046.50, 'sine', 0.4),
            win: this.createSoundSequence([1046.50, 1318.51, 1567.98]),
            lose: this.createSoundSequence([392.00, 349.23, 329.63])
        };
    }

    createSound(frequency, type, duration) {
        return () => {
            if (!this.gameState.settings.sound || !this.audio.context) return;
            
            try {
                const oscillator = this.audio.context.createOscillator();
                const gainNode = this.audio.context.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audio.context.destination);
                
                oscillator.frequency.value = frequency;
                oscillator.type = type;
                
                gainNode.gain.setValueAtTime(0.3, this.audio.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, 
                    this.audio.context.currentTime + duration);
                
                oscillator.start();
                oscillator.stop(this.audio.context.currentTime + duration);
            } catch (error) {
                console.error('خطأ في تشغيل الصوت:', error);
            }
        };
    }

    createSoundSequence(frequencies) {
        return () => {
            if (!this.gameState.settings.sound || !this.audio.context) return;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    this.createSound(freq, 'sine', 0.2)();
                }, index * 200);
            });
        };
    }

    playSound(soundName) {
        if (this.audio.sounds[soundName]) {
            this.audio.sounds[soundName]();
        }
    }

    // ============================================
    // نظام واجهة المستخدم
    // ============================================
    setupUI() {
        this.ui = {
            elements: {},
            currentScreen: 'main-menu',
            notifications: []
        };

        // حفظ العناصر المهمة
        this.ui.elements = {
            app: document.getElementById('app'),
            loadingScreen: document.getElementById('loading-screen'),
            mainMenu: document.getElementById('main-menu'),
            gameScreen: document.getElementById('game-screen'),
            shopScreen: document.getElementById('shop-screen'),
            profileScreen: document.getElementById('profile-screen'),
            gameBoard: document.getElementById('game-board'),
            goalsList: document.getElementById('goals-list'),
            powerupsGrid: document.getElementById('powerups-grid'),
            dailyQuests: document.getElementById('daily-quests'),
            totalScore: document.getElementById('total-score'),
            totalCoins: document.getElementById('total-coins'),
            currentLevel: document.getElementById('current-level'),
            playerXP: document.getElementById('player-xp'),
            movesLeft: document.getElementById('moves-left'),
            currentScore: document.getElementById('current-score'),
            levelName: document.getElementById('level-name'),
            progressFill: document.getElementById('progress-fill'),
            progressPercent: document.getElementById('progress-percent')
        };

        // إعداد مستمعي الأحداث
        this.setupEventListeners();
    }

    setupEventListeners() {
        // مستمعي اللمس للسحب
        let touchStartX = 0;
        let touchStartY = 0;

        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!this.levelState.gameActive || this.ui.currentScreen !== 'game') return;
            
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            
            // التعرف على السحب الأفقي
            if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
                this.handleSwipe(deltaX > 0 ? 'right' : 'left');
                touchStartX = touchX;
            }
        }, { passive: true });

        // مستمعي لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (!this.levelState.gameActive || this.ui.currentScreen !== 'game') return;
            
            switch(e.key) {
                case 'ArrowLeft':
                    this.moveSelection('left');
                    break;
                case 'ArrowRight':
                    this.moveSelection('right');
                    break;
                case 'ArrowUp':
                    this.moveSelection('up');
                    break;
                case 'ArrowDown':
                    this.moveSelection('down');
                    break;
                case 'Enter':
                case ' ':
                    if (this.levelState.selectedCell) {
                        this.handleCellClick(...this.levelState.selectedCell);
                    }
                    break;
            }
        });

        // منع التمرير الافتراضي
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('#game-board')) {
                e.preventDefault();
            }
        }, { passive: false });

        // حفظ عند الخروج
        window.addEventListener('beforeunload', () => this.saveGameData());
        window.addEventListener('blur', () => {
            if (this.levelState.gameActive) {
                this.pauseGame();
            }
        });
    }

    // ============================================
    // نظام التحميل والبدء
    // ============================================
    startLoading() {
        // محاكاة التحميل
        setTimeout(() => {
            this.ui.elements.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.ui.elements.loadingScreen.style.display = 'none';
                this.ui.elements.app.style.display = 'block';
                this.showMainMenu();
            }, 500);
        }, 1500);
    }

    showMainMenu() {
        this.ui.currentScreen = 'main-menu';
        this.hideAllScreens();
        this.ui.elements.mainMenu.style.display = 'block';
        this.updatePlayerStats();
    }

    startGame(level = this.gameState.currentLevel) {
        this.loadLevel(level);
        this.ui.currentScreen = 'game';
        this.hideAllScreens();
        this.ui.elements.gameScreen.style.display = 'block';
        this.playSound('select');
    }

    loadLevel(levelNumber) {
        const level = this.levels[levelNumber - 1];
        
        // إعادة تعيين حالة المستوى
        this.levelState = {
            movesLeft: level.moves,
            currentScore: 0,
            selectedCell: null,
            board: [],
            matches: [],
            combo: 1,
            gameActive: true,
            goals: JSON.parse(JSON.stringify(level.goals)),
            powerups: {
                shuffle: 2,
                hammer: 1,
                bomb: 1,
                hint: 3
            },
            collectedItems: {}
        };

        // تحديث واجهة المستخدم
        this.ui.elements.levelName.textContent = level.name;
        this.ui.elements.movesLeft.textContent = level.moves;
        this.ui.elements.currentScore.textContent = '0';
        this.updateProgress(0);

        // إنشاء اللوحة
        this.createBoard();
        
        // تحديث الأهداف والعناصر المساعدة
        this.updateGoalsDisplay();
        this.updatePowerupsDisplay();
        this.updateDailyQuests();
    }

    // ============================================
    // نظام لوحة اللعبة
    // ============================================
    createBoard() {
        const boardElement = this.ui.elements.gameBoard;
        boardElement.innerHTML = '';
        
        this.levelState.board = [];
        const level = this.levels[this.gameState.currentLevel - 1];
        
        for (let row = 0; row < this.config.boardSize; row++) {
            this.levelState.board[row] = [];
            for (let col = 0; col < this.config.boardSize; col++) {
                // اختيار أيقونة عشوائية
                const icon = this.getRandomIcon();
                this.levelState.board[row][col] = icon;
                
                // إنشاء الخلية
                const cell = this.createCell(row, col, icon);
                boardElement.appendChild(cell);
            }
        }
        
        // التأكد من عدم وجود تطابقات في البداية
        while (this.findMatches().length > 0) {
            this.shuffleBoard();
        }
    }

    createCell(row, col, icon) {
        const cell = document.createElement('div');
        cell.className = `cell ${icon.bg}`;
        cell.dataset.row = row;
        cell.dataset.col = col;
        cell.dataset.type = icon.type;
        
        const iconSpan = document.createElement('span');
        iconSpan.textContent = icon.emoji;
        iconSpan.style.color = icon.color;
        cell.appendChild(iconSpan);
        
        cell.addEventListener('click', () => this.handleCellClick(row, col));
        
        return cell;
    }

    getRandomIcon() {
        const level = this.gameState.currentLevel;
        const availableIcons = this.icons.slice(0, Math.min(6 + Math.floor(level / 10), this.icons.length));
        return availableIcons[Math.floor(Math.random() * availableIcons.length)];
    }

    // ============================================
    // نظام المطابقة واللعب
    // ============================================
    handleCellClick(row, col) {
        if (!this.levelState.gameActive) return;
        
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (!this.levelState.selectedCell) {
            // تحديد الخلية الأولى
            this.levelState.selectedCell = [row, col];
            cell.classList.add('selected');
            this.playSound('select');
        } else {
            const [selectedRow, selectedCol] = this.levelState.selectedCell;
            
            // إذا نقرنا على نفس الخلية
            if (selectedRow === row && selectedCol === col) {
                cell.classList.remove('selected');
                this.levelState.selectedCell = null;
                return;
            }
            
            // التحقق من التجاور
            const isAdjacent = Math.abs(selectedRow - row) + Math.abs(selectedCol - col) === 1;
            
            if (isAdjacent) {
                // تبديل الخلايا
                this.swapCells(selectedRow, selectedCol, row, col, true);
                this.playSound('swap');
            } else {
                // إلغاء التحديد القديم وتحديد الجديد
                document.querySelector(`[data-row="${selectedRow}"][data-col="${selectedCol}"]`)
                    .classList.remove('selected');
                this.levelState.selectedCell = [row, col];
                cell.classList.add('selected');
            }
        }
    }

    swapCells(row1, col1, row2, col2, checkMatch = true) {
        // إلغاء التحديد
        if (this.levelState.selectedCell) {
            const [selectedRow, selectedCol] = this.levelState.selectedCell;
            document.querySelector(`[data-row="${selectedRow}"][data-col="${selectedCol}"]`)
                .classList.remove('selected');
            this.levelState.selectedCell = null;
        }
        
        // التبديل في المصفوفة
        const temp = this.levelState.board[row1][col1];
        this.levelState.board[row1][col1] = this.levelState.board[row2][col2];
        this.levelState.board[row2][col2] = temp;
        
        // تحديث العرض
        this.updateCellDisplay(row1, col1);
        this.updateCellDisplay(row2, col2);
        
        // التحقق من التطابقات
        if (checkMatch) {
            setTimeout(() => {
                const matches = this.findMatches();
                if (matches.length > 0) {
                    this.handleMatches(matches);
                    this.levelState.movesLeft--;
                    this.updateUI();
                    this.checkLevelCompletion();
                } else {
                    // إعادة التبديل إذا لم يكن هناك تطابق
                    this.swapCells(row1, col1, row2, col2, false);
                    this.showNotification('لا يوجد تطابق! حاول حركة أخرى', 'warning');
                }
            }, 300);
        }
    }

    findMatches() {
        const matches = [];
        const board = this.levelState.board;
        
        // البحث عن تطابقات أفقية
        for (let row = 0; row < this.config.boardSize; row++) {
            for (let col = 0; col < this.config.boardSize - 2; col++) {
                if (board[row][col] && board[row][col + 1] && board[row][col + 2]) {
                    const type1 = board[row][col].type;
                    const type2 = board[row][col + 1].type;
                    const type3 = board[row][col + 2].type;
                    
                    if (type1 === type2 && type2 === type3) {
                        let matchLength = 3;
                        while (col + matchLength < this.config.boardSize && 
                               board[row][col + matchLength] && 
                               board[row][col + matchLength].type === type1) {
                            matchLength++;
                        }
                        
                        matches.push({
                            type: 'horizontal',
                            row: row,
                            startCol: col,
                            length: matchLength,
                            iconType: type1
                        });
                        
                        col += matchLength - 1;
                    }
                }
            }
        }
        
        // البحث عن تطابقات رأسية
        for (let col = 0; col < this.config.boardSize; col++) {
            for (let row = 0; row < this.config.boardSize - 2; row++) {
                if (board[row][col] && board[row + 1][col] && board[row + 2][col]) {
                    const type1 = board[row][col].type;
                    const type2 = board[row + 1][col].type;
                    const type3 = board[row + 2][col].type;
                    
                    if (type1 === type2 && type2 === type3) {
                        let matchLength = 3;
                        while (row + matchLength < this.config.boardSize && 
                               board[row + matchLength][col] && 
                               board[row + matchLength][col].type === type1) {
                            matchLength++;
                        }
                        
                        matches.push({
                            type: 'vertical',
                            col: col,
                            startRow: row,
                            length: matchLength,
                            iconType: type1
                        });
                        
                        row += matchLength - 1;
                    }
                }
            }
        }
        
        return matches;
    }

    handleMatches(matches) {
        let totalPoints = 0;
        
        matches.forEach(match => {
            // حساب النقاط مع مراعاة الكومبو
            const matchPoints = match.length * this.config.matchPoints * this.levelState.combo;
            totalPoints += matchPoints;
            
            // تحديث الأهداف
            this.updateGoals(match);
            
            // عرض التأثيرات
            this.createMatchEffect(match);
            this.showFloatingText(`+${Math.round(matchPoints)}`, match);
            
            // إزالة الخلايا المتطابقة
            this.removeMatchedCells(match);
        });
        
        // تحديث النقاط والكومبو
        this.levelState.currentScore += Math.round(totalPoints);
        this.levelState.combo = Math.min(this.config.maxCombo, this.levelState.combo + 0.1);
        
        // عرض الكومبو
        if (this.levelState.combo >= 1.5) {
            this.showCombo(this.levelState.combo);
        }
        
        // تشغيل الصوت
        this.playSound('match');
        
        // سقوط الأيقونات الجديدة
        setTimeout(() => {
            this.dropNewIcons();
            setTimeout(() => {
                const newMatches = this.findMatches();
                if (newMatches.length > 0) {
                    this.handleMatches(newMatches);
                }
            }, 500);
        }, 500);
    }

    updateCellDisplay(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (!cell) return;
        
        const icon = this.levelState.board[row][col];
        if (!icon) return;
        
        // تحديث الفئة للخلفية
        cell.className = `cell ${icon.bg}`;
        cell.dataset.type = icon.type;
        
        // تحديث الأيقونة
        const iconSpan = cell.querySelector('span');
        if (iconSpan) {
            iconSpan.textContent = icon.emoji;
            iconSpan.style.color = icon.color;
        }
    }

    removeMatchedCells(match) {
        const cellsToRemove = [];
        
        if (match.type === 'horizontal') {
            for (let i = 0; i < match.length; i++) {
                cellsToRemove.push({
                    row: match.row,
                    col: match.startCol + i
                });
            }
        } else {
            for (let i = 0; i < match.length; i++) {
                cellsToRemove.push({
                    row: match.startRow + i,
                    col: match.col
                });
            }
        }
        
        // إزالة الخلايا
        cellsToRemove.forEach(({ row, col }) => {
            this.levelState.board[row][col] = null;
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                cell.style.opacity = '0';
                cell.style.transform = 'scale(0)';
                setTimeout(() => {
                    cell.remove();
                }, 300);
            }
        });
    }

    dropNewIcons() {
        for (let col = 0; col < this.config.boardSize; col++) {
            let emptySpaces = 0;
            
            // حساب الفراغات من الأسفل
            for (let row = this.config.boardSize - 1; row >= 0; row--) {
                if (!this.levelState.board[row][col]) {
                    emptySpaces++;
                } else if (emptySpaces > 0) {
                    // إنزال الأيقونة
                    const targetRow = row + emptySpaces;
                    this.levelState.board[targetRow][col] = this.levelState.board[row][col];
                    this.levelState.board[row][col] = null;
                    
                    // تحديث العرض
                    this.updateCellDisplay(targetRow, col);
                }
            }
            
            // إنشاء أيقونات جديدة في الأعلى
            for (let i = 0; i < emptySpaces; i++) {
                const newIcon = this.getRandomIcon();
                const row = emptySpaces - i - 1;
                this.levelState.board[row][col] = newIcon;
                
                // إنشاء الخلية الجديدة
                const cell = this.createCell(row, col, newIcon);
                cell.style.opacity = '0';
                cell.style.transform = 'translateY(-100px)';
                
                const boardElement = this.ui.elements.gameBoard;
                const firstCell = boardElement.querySelector(`[data-col="${col}"]`);
                if (firstCell) {
                    boardElement.insertBefore(cell, firstCell);
                } else {
                    boardElement.appendChild(cell);
                }
                
                // أنيمشن السقوط
                setTimeout(() => {
                    cell.style.transition = 'all 0.5s ease';
                    cell.style.opacity = '1';
                    cell.style.transform = 'translateY(0)';
                }, i * 100);
            }
        }
    }

    updateGoals(match) {
        this.levelState.goals.forEach(goal => {
            if (goal.type === 'collect' && goal.icon === match.iconType) {
                goal.current += match.length;
            } else if (goal.type === 'score') {
                goal.current += match.length * this.config.matchPoints * this.levelState.combo;
            } else if (goal.type === 'combo' && this.levelState.combo >= goal.target) {
                goal.current = goal.target;
            }
        });
        
        this.updateGoalsDisplay();
    }

    checkLevelCompletion() {
        const allGoalsCompleted = this.levelState.goals.every(goal => goal.current >= goal.target);
        
        if (allGoalsCompleted) {
            this.levelComplete();
        } else if (this.levelState.movesLeft <= 0) {
            this.levelFailed();
        }
    }

    levelComplete() {
        this.levelState.gameActive = false;
        
        // حساب المكافآت
        const movesBonus = this.levelState.movesLeft * 10;
        const totalReward = this.levelState.currentScore + movesBonus;
        
        // تحديث حالة اللعبة
        this.gameState.totalScore += totalReward;
        this.gameState.totalCoins += 50; // مكافأة أساسية
        this.gameState.playerXP += 20;
        
        // عرض شاشة الفوز
        document.getElementById('win-moves').textContent = this.levelState.movesLeft;
        document.getElementById('win-score').textContent = totalReward.toLocaleString();
        document.getElementById('win-bonus').textContent = `+${movesBonus}`;
        
        document.getElementById('win-popup').classList.add('active');
        this.playSound('win');
        
        // حفظ التقدم
        this.saveGameData();
    }

    levelFailed() {
        this.levelState.gameActive = false;
        document.getElementById('lose-popup').classList.add('active');
        this.playSound('lose');
    }

    updateUI() {
        this.ui.elements.movesLeft.textContent = this.levelState.movesLeft;
        this.ui.elements.currentScore.textContent = this.levelState.currentScore.toLocaleString();
        
        // تحديث التقدم
        const totalGoals = this.levelState.goals.reduce((sum, goal) => sum + goal.target, 0);
        const currentProgress = this.levelState.goals.reduce((sum, goal) => sum + Math.min(goal.current, goal.target), 0);
        const progressPercent = (currentProgress / totalGoals) * 100;
        
        this.updateProgress(progressPercent);
        
        // تحديث النقاط الإجمالية
        this.ui.elements.totalScore.textContent = this.gameState.totalScore.toLocaleString();
    }

    showNotification(message, type = 'info') {
        const notificationArea = document.getElementById('notification-area');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        notificationArea.appendChild(notification);
        
        // إظهار الإشعار
        setTimeout(() => notification.classList.add('show'), 10);
        
        // إخفاء الإشعار بعد 3 ثوانٍ
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }

    createMatchEffect(match) {
        const boardElement = this.ui.elements.gameBoard;
        const firstCell = boardElement.querySelector(`[data-row="${match.type === 'horizontal' ? match.row : match.startRow}"][data-col="${match.type === 'horizontal' ? match.startCol : match.col}"]`);
        
        if (firstCell) {
            const rect = firstCell.getBoundingClientRect();
            const explosion = document.createElement('div');
            explosion.className = 'match-effect explosion';
            explosion.style.left = `${rect.left + rect.width / 2}px`;
            explosion.style.top = `${rect.top + rect.height / 2}px`;
            
            document.body.appendChild(explosion);
            
            setTimeout(() => explosion.remove(), 500);
        }
    }

    showFloatingText(text, match) {
        const boardElement = this.ui.elements.gameBoard;
        const firstCell = boardElement.querySelector(`[data-row="${match.type === 'horizontal' ? match.row : match.startRow}"][data-col="${match.type === 'horizontal' ? match.startCol : match.col}"]`);
        
        if (firstCell) {
            const rect = firstCell.getBoundingClientRect();
            const floatingText = document.createElement('div');
            floatingText.className = 'match-effect floating-text';
            floatingText.textContent = text;
            floatingText.style.left = `${rect.left + rect.width / 2}px`;
            floatingText.style.top = `${rect.top}px`;
            
            document.body.appendChild(floatingText);
            
            setTimeout(() => floatingText.remove(), 1000);
        }
    }

    showCombo(combo) {
        const comboDisplay = document.getElementById('combo-display');
        comboDisplay.textContent = `${combo.toFixed(1)}x كومبو!`;
        comboDisplay.classList.remove('show');
        void comboDisplay.offsetWidth; // إعادة التدفق
        comboDisplay.classList.add('show');
        
        setTimeout(() => comboDisplay.classList.remove('show'), 500);
    }

    // ============================================
    // الأدوات المساعدة
    // ============================================
    getRandomItems(array, count) {
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    getRandomPowerups(level) {
        const powerupKeys = Object.keys(this.powerups);
        const count = Math.min(2, Math.floor(level / 5) + 1);
        return this.getRandomItems(powerupKeys, count);
    }

    hideAllScreens() {
        this.ui.elements.mainMenu.style.display = 'none';
        this.ui.elements.gameScreen.style.display = 'none';
        this.ui.elements.shopScreen.style.display = 'none';
        this.ui.elements.profileScreen.style.display = 'none';
    }

    updatePlayerStats() {
        this.ui.elements.totalScore.textContent = this.gameState.totalScore.toLocaleString();
        this.ui.elements.totalCoins.textContent = this.gameState.totalCoins.toLocaleString();
        this.ui.elements.currentLevel.textContent = `المستوى ${this.gameState.currentLevel}`;
        this.ui.elements.playerXP.textContent = `XP: ${this.gameState.playerXP}/100`;
    }

    updateProgress(percent) {
        this.ui.elements.progressFill.style.width = `${percent}%`;
        this.ui.elements.progressPercent.textContent = `${Math.round(percent)}%`;
    }

    // ============================================
    // واجهات المستخدم العامة
    // ============================================
    updateGoalsDisplay() {
        const goalsList = this.ui.elements.goalsList;
        goalsList.innerHTML = '';
        
        this.levelState.goals.forEach((goal, index) => {
            const goalItem = document.createElement('div');
            goalItem.className = `goal-item ${goal.current >= goal.target ? 'completed' : ''}`;
            
            let icon = '🎯';
            let text = '';
            
            if (goal.type === 'collect') {
                const iconData = this.icons.find(i => i.type === goal.icon);
                icon = iconData ? iconData.emoji : '🎯';
                text = `اجمع ${goal.target} ${goal.icon === 'coffee' ? 'قهوة' : 
                       goal.icon === 'palm' ? 'نخلة' : 
                       goal.icon === 'moon' ? 'هلال' : 
                       goal.icon === 'mosque' ? 'مسجد' : 
                       goal.icon === 'camel' ? 'جمل' : 'فانوس'}`;
            } else if (goal.type === 'score') {
                icon = '⭐';
                text = `احصل على ${goal.target} نقطة`;
            } else if (goal.type === 'combo') {
                icon = '⚡';
                text = `حقق ${goal.target}x تتابع`;
            }
            
            const progressPercent = Math.min(100, (goal.current / goal.target) * 100);
            
            goalItem.innerHTML = `
                <div class="goal-icon">${icon}</div>
                <div class="goal-content">
                    <div class="goal-text">${text}</div>
                    <div class="goal-progress">
                        <div class="goal-fill" style="width: ${progressPercent}%"></div>
                    </div>
                    <div class="goal-percent">${goal.current}/${goal.target}</div>
                </div>
            `;
            
            goalsList.appendChild(goalItem);
        });
    }

    updatePowerupsDisplay() {
        const powerupsGrid = this.ui.elements.powerupsGrid;
        powerupsGrid.innerHTML = '';
        
        Object.entries(this.levelState.powerups).forEach(([key, count]) => {
            const powerup = this.powerups[key];
            if (!powerup || count <= 0) return;
            
            const powerupItem = document.createElement('div');
            powerupItem.className = 'powerup-item';
            powerupItem.onclick = () => this.usePowerup(key);
            
            powerupItem.innerHTML = `
                <span class="powerup-icon">${powerup.emoji}</span>
                <div class="powerup-name">${powerup.name}</div>
                <div class="powerup-cost">${powerup.cost} ذهب</div>
                <div class="powerup-count">${count}</div>
            `;
            
            powerupsGrid.appendChild(powerupItem);
        });
    }

    updateDailyQuests() {
        const dailyQuests = this.ui.elements.dailyQuests;
        dailyQuests.innerHTML = '';
        
        this.dailyQuests.forEach(quest => {
            const questItem = document.createElement('div');
            questItem.className = 'quest-item';
            
            const progressPercent = Math.min(100, (quest.current / quest.target) * 100);
            
            questItem.innerHTML = `
                <span>${quest.emoji}</span>
                <div style="flex: 1">
                    <div>${quest.description}</div>
                    <div class="goal-progress" style="margin-top: 5px;">
                        <div class="goal-fill" style="width: ${progressPercent}%"></div>
                    </div>
                </div>
                <div class="quest-reward">+${quest.reward}</div>
            `;
            
            dailyQuests.appendChild(questItem);
        });
    }

    // ============================================
    // وظائف التحكم
    // ============================================
    usePowerup(powerupType) {
        if (!this.levelState.gameActive) return;
        
        const powerup = this.powerups[powerupType];
        if (!powerup || this.levelState.powerups[powerupType] <= 0) {
            this.showNotification('لا يوجد من هذا العنصر!', 'warning');
            return;
        }
        
        if (this.gameState.totalCoins < powerup.cost) {
            this.showNotification(`تحتاج ${powerup.cost} ذهب!`, 'error');
            return;
        }
        
        // خصم التكلفة
        this.gameState.totalCoins -= powerup.cost;
        this.levelState.powerups[powerupType]--;
        
        // تطبيق تأثير العنصر
        switch(powerupType) {
            case 'shuffle':
                this.shuffleBoard();
                this.showNotification('تم إعادة ترتيب اللوحة!', 'info');
                break;
            case 'hammer':
                this.activateHammer();
                break;
            case 'bomb':
                this.activateBomb();
                break;
            case 'hint':
                this.showHint();
                break;
            case 'extraMoves':
                this.levelState.movesLeft += 5;
                this.showNotification('+5 حركات إضافية!', 'success');
                break;
        }
        
        this.updatePowerupsDisplay();
        this.updatePlayerStats();
        this.playSound('powerup');
    }

    shuffleBoard() {
        if (!this.levelState.gameActive) return;
        
        // جمع كل الأيقونات
        let allIcons = [];
        for (let row = 0; row < this.config.boardSize; row++) {
            for (let col = 0; col < this.config.boardSize; col++) {
                if (this.levelState.board[row][col]) {
                    allIcons.push(this.levelState.board[row][col]);
                }
            }
        }
        
        // خلط الأيقونات
        allIcons = this.shuffleArray(allIcons);
        
        // إعادة التوزيع
        let index = 0;
        for (let row = 0; row < this.config.boardSize; row++) {
            for (let col = 0; col < this.config.boardSize; col++) {
                if (this.levelState.board[row][col]) {
                    this.levelState.board[row][col] = allIcons[index];
                    index++;
                    this.updateCellDisplay(row, col);
                }
            }
        }
        
        this.playSound('shuffle');
    }

    showHint() {
        const matches = this.findMatches();
        if (matches.length > 0) {
            const match = matches[0];
            let row, col;
            
            if (match.type === 'horizontal') {
                row = match.row;
                col = match.startCol;
            } else {
                row = match.startRow;
                col = match.col;
            }
            
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            cell.classList.add('selected');
            setTimeout(() => cell.classList.remove('selected'), 2000);
            this.showNotification('جرب هنا!', 'info');
        } else {
            this.showNotification('لا توجد تطابقات واضحة', 'warning');
        }
        
        this.playSound('select');
    }

    activateHammer() {
        this.showNotification('انقر على أيقونة لإزالتها', 'info');
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const originalClick = cell.onclick;
            cell.onclick = () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                if (this.levelState.board[row][col]) {
                    // إزالة الأيقونة
                    this.levelState.board[row][col] = null;
                    cell.style.opacity = '0';
                    cell.style.transform = 'scale(0)';
                    
                    setTimeout(() => {
                        cell.remove();
                        this.dropNewIcons();
                        
                        // استعادة الأحداث الأصلية
                        cells.forEach(c => c.onclick = null);
                        this.setupBoardEvents();
                        
                        this.levelState.movesLeft--;
                        this.updateUI();
                    }, 300);
                }
            };
        });
    }

    activateBomb() {
        this.showNotification('انقر على مكان القنبلة', 'info');
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const originalClick = cell.onclick;
            cell.onclick = () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                
                // إزالة الأيقونات في دائرة نصف قطرها 2
                for (let r = Math.max(0, row - 2); r <= Math.min(this.config.boardSize - 1, row + 2); r++) {
                    for (let c = Math.max(0, col - 2); c <= Math.min(this.config.boardSize - 1, col + 2); c++) {
                        if (Math.sqrt((r - row) ** 2 + (c - col) ** 2) <= 2 && this.levelState.board[r][c]) {
                            this.levelState.board[r][c] = null;
                            const targetCell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                            if (targetCell) {
                                targetCell.style.opacity = '0';
                                targetCell.style.transform = 'scale(0)';
                            }
                        }
                    }
                }
                
                setTimeout(() => {
                    // إزالة الخلايا
                    for (let r = Math.max(0, row - 2); r <= Math.min(this.config.boardSize - 1, row + 2); r++) {
                        for (let c = Math.max(0, col - 2); c <= Math.min(this.config.boardSize - 1, col + 2); c++) {
                            if (Math.sqrt((r - row) ** 2 + (c - col) ** 2) <= 2) {
                                const targetCell = document.querySelector(`[data-row="${r}"][data-col="${c}"]`);
                                if (targetCell) targetCell.remove();
                            }
                        }
                    }
                    
                    this.dropNewIcons();
                    
                    // استعادة الأحداث الأصلية
                    cells.forEach(c => c.onclick = null);
                    this.setupBoardEvents();
                    
                    this.levelState.movesLeft--;
                    this.updateUI();
                }, 300);
            };
        });
    }

    setupBoardEvents() {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            cell.addEventListener('click', () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                this.handleCellClick(row, col);
            });
        });
    }

    pauseGame() {
        this.levelState.gameActive = false;
        document.getElementById('pause-popup').classList.add('active');
        this.playSound('select');
    }

    resumeGame() {
        this.levelState.gameActive = true;
        document.getElementById('pause-popup').classList.remove('active');
        this.playSound('select');
    }

    restartLevel() {
        this.loadLevel(this.gameState.currentLevel);
        document.getElementById('pause-popup').classList.remove('active');
        document.getElementById('lose-popup').classList.remove('active');
        this.playSound('select');
    }

    nextLevel() {
        if (this.gameState.currentLevel < this.levels.length) {
            this.gameState.currentLevel++;
            this.gameState.maxLevel = Math.max(this.gameState.maxLevel, this.gameState.currentLevel);
            this.startGame(this.gameState.currentLevel);
            document.getElementById('win-popup').classList.remove('active');
            this.saveGameData();
        }
    }

    showShop() {
        this.ui.currentScreen = 'shop';
        this.hideAllScreens();
        this.ui.elements.shopScreen.style.display = 'block';
        this.renderShopItems();
    }

    renderShopItems() {
        const shopItems = document.getElementById('shop-items');
        shopItems.innerHTML = '';
        
        const items = [
            { id: 'powerup_pack', name: 'حزمة العناصر المساعدة', emoji: '🎁', price: 200, description: '5 من كل عنصر مساعد' },
            { id: 'coins_500', name: '500 ذهب', emoji: '🪙', price: 4.99, description: 'للشراء الحقيقي', featured: true },
            { id: 'no_ads', name: 'إزالة الإعلانات', emoji: '🚫', price: 9.99, description: 'إزالة الإعلانات مدى الحياة' },
            { id: 'avatar_pack', name: 'حزمة الأفاتار', emoji: '👤', price: 150, description: '10 أشكال أفاتار جديدة' },
            { id: 'theme_pack', name: 'حزمة السمات', emoji: '🎨', price: 100, description: '5 سمات جديدة للعبة' },
            { id: 'unlock_all', name: 'فتح كل المستويات', emoji: '🔓', price: 299, description: 'فتح جميع المستويات مباشرة' }
        ];
        
        items.forEach(item => {
            const shopItem = document.createElement('div');
            shopItem.className = `shop-item ${item.featured ? 'featured' : ''}`;
            shopItem.innerHTML = `
                <div style="font-size: 48px; margin-bottom: 15px;">${item.emoji}</div>
                <h3 style="margin-bottom: 10px;">${item.name}</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 15px;">${item.description}</p>
                <div class="game-btn btn-primary" style="margin-top: auto;">
                    ${typeof item.price === 'number' && item.price < 10 ? '$' : ''}${item.price} ${typeof item.price === 'number' && item.price < 10 ? '' : 'ذهبية'}
                </div>
            `;
            
            shopItem.onclick = () => this.purchaseItem(item);
            shopItems.appendChild(shopItem);
        });
    }

    purchaseItem(item) {
        if (typeof item.price === 'number' && item.price < 10) {
            this.showNotification('المشتريات الحقيقية قريباً...', 'info');
        } else if (this.gameState.totalCoins >= item.price) {
            this.gameState.totalCoins -= item.price;
            
            switch(item.id) {
                case 'powerup_pack':
                    Object.keys(this.powerups).forEach(key => {
                        this.levelState.powerups[key] = (this.levelState.powerups[key] || 0) + 5;
                    });
                    this.showNotification('تم شراء حزمة العناصر المساعدة!', 'success');
                    break;
                case 'avatar_pack':
                    this.showNotification('تم شراء حزمة الأفاتار!', 'success');
                    break;
                case 'theme_pack':
                    this.showNotification('تم شراء حزمة السمات!', 'success');
                    break;
                case 'unlock_all':
                    this.gameState.maxLevel = this.levels.length;
                    this.showNotification('تم فتح جميع المستويات!', 'success');
                    break;
            }
            
            this.updatePlayerStats();
            this.saveGameData();
        } else {
            this.showNotification('لا يوجد ذهب كافٍ!', 'error');
        }
    }

    showProfile() {
        this.ui.currentScreen = 'profile';
        this.hideAllScreens();
        this.ui.elements.profileScreen.style.display = 'block';
        this.renderProfile();
    }

    renderProfile() {
        // تحديث الأفاتار
        const playerAvatar = document.getElementById('player-avatar');
        const playerName = document.getElementById('player-name');
        const playerRank = document.getElementById('player-rank');
        
        // تحديث الإحصائيات
        const playerStats = document.getElementById('player-stats');
        playerStats.innerHTML = '';
        
        const stats = [
            { label: 'المستوى', value: this.gameState.currentLevel, emoji: '🏆' },
            { label: 'النقاط الإجمالية', value: this.gameState.totalScore.toLocaleString(), emoji: '⭐' },
            { label: 'الذهب', value: this.gameState.totalCoins.toLocaleString(), emoji: '🪙' },
            { label: 'السلسلة اليومية', value: `${this.gameState.dailyStreak} يوم`, emoji: '🔥' },
            { label: 'أعلى مستوى', value: this.gameState.maxLevel, emoji: '📈' },
            { label: 'إجمالي المطابقات', value: '0', emoji: '✨' }
        ];
        
        stats.forEach(stat => {
            const statElement = document.createElement('div');
            statElement.className = 'achievement-item';
            statElement.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 10px;">${stat.emoji}</div>
                <div style="font-weight: bold; margin-bottom: 5px;">${stat.value}</div>
                <div style="font-size: 12px; color: #666;">${stat.label}</div>
            `;
            playerStats.appendChild(statElement);
        });
        
        // تحديث الإنجازات
        const achievementsGrid = document.getElementById('achievements-grid');
        achievementsGrid.innerHTML = '';
        
        this.achievements.forEach(achievement => {
            const unlocked = Math.random() > 0.5; // في الحقيقة، تحقق من حالة الإنجاز
            const achievementElement = document.createElement('div');
            achievementElement.className = `achievement-item ${unlocked ? 'unlocked' : ''}`;
            achievementElement.innerHTML = `
                <div style="font-size: 32px; margin-bottom: 10px;">${achievement.emoji}</div>
                <div style="font-weight: bold; margin-bottom: 5px; font-size: 14px;">${achievement.name}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 10px;">${achievement.description}</div>
                <div style="font-size: 11px; color: ${unlocked ? 'green' : '#999'}">
                    ${unlocked ? 'تم الانجاز' : 'غير مكتمل'}
                </div>
            `;
            achievementsGrid.appendChild(achievementElement);
        });
    }

    showLevels() {
        const levelsGrid = document.getElementById('levels-grid');
        levelsGrid.innerHTML = '';
        
        for (let i = 1; i <= Math.min(50, this.levels.length); i++) {
            const levelElement = document.createElement('div');
            levelElement.className = 'powerup-item';
            levelElement.style.cursor = 'pointer';
            levelElement.style.textAlign = 'center';
            
            const isLocked = i > this.gameState.maxLevel;
            const isCurrent = i === this.gameState.currentLevel;
            
            levelElement.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 5px;">${isLocked ? '🔒' : '🏆'}</div>
                <div style="font-weight: bold;">${i}</div>
                ${isCurrent ? '<div style="font-size: 10px; color: var(--primary); margin-top: 5px;">الحالي</div>' : ''}
            `;
            
            if (!isLocked) {
                levelElement.onclick = () => {
                    this.gameState.currentLevel = i;
                    this.startGame(i);
                    document.getElementById('levels-popup').classList.remove('active');
                };
            }
            
            levelsGrid.appendChild(levelElement);
        }
        
        document.getElementById('levels-popup').classList.add('active');
    }

    closeLevels() {
        document.getElementById('levels-popup').classList.remove('active');
    }

    // ============================================
    // وظائف الصوت
    // ============================================
    toggleMusic() {
        this.gameState.settings.music = !this.gameState.settings.music;
        const btn = document.getElementById('music-btn');
        btn.textContent = this.gameState.settings.music ? '🎵' : '🔇';
        this.showNotification(this.gameState.settings.music ? 'الموسيقى مفعلة' : 'الموسيقى معطلة');
        this.saveGameData();
    }

    toggleSound() {
        this.gameState.settings.sound = !this.gameState.settings.sound;
        const btn = document.getElementById('sound-btn');
        btn.textContent = this.gameState.settings.sound ? '🔊' : '🔇';
        this.showNotification(this.gameState.settings.sound ? 'الأصوات مفعلة' : 'الأصوات معطلة');
        this.saveGameData();
    }

    // ============================================
    // الأدوات المساعدة
    // ============================================
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    handleSwipe(direction) {
        if (this.levelState.selectedCell) {
            const [row, col] = this.levelState.selectedCell;
            let newRow = row;
            let newCol = col;
            
            switch(direction) {
                case 'left': newCol = Math.max(0, col - 1); break;
                case 'right': newCol = Math.min(this.config.boardSize - 1, col + 1); break;
                case 'up': newRow = Math.max(0, row - 1); break;
                case 'down': newRow = Math.min(this.config.boardSize - 1, row + 1); break;
            }
            
            if (newRow !== row || newCol !== col) {
                this.handleCellClick(newRow, newCol);
            }
        }
    }

    moveSelection(direction) {
        this.handleSwipe(direction);
    }
}

// ============================================
// بدء اللعبة عند تحميل الصفحة
// ============================================
let game;

window.onload = () => {
    game = new ArabicMatchGame();
};

// وظائف عامة للاستدعاء من HTML
window.startGame = () => game.startGame();
window.showMainMenu = () => game.showMainMenu();
window.pauseGame = () => game.pauseGame();
window.resumeGame = () => game.resumeGame();
window.restartLevel = () => game.restartLevel();
window.nextLevel = () => game.nextLevel();
window.showShop = () => game.showShop();
window.showProfile = () => game.showProfile();
window.showLevels = () => game.showLevels();
window.closeLevels = () => game.closeLevels();
window.showHint = () => game.showHint();
window.shuffleBoard = () => game.shuffleBoard();
window.toggleMusic = () => game.toggleMusic();
window.toggleSound = () => game.toggleSound();
window.showSettings = () => {
    game.showNotification('الإعدادات قريباً...', 'info');
};
window.showTutorial = () => {
    game.showNotification('شرح اللعبة قريباً...', 'info');
};
window.playAgain = () => {
    game.restartLevel();
    document.getElementById('win-popup').classList.remove('active');
};
window.useContinue = () => {
    if (game.gameState.totalCoins >= 50) {
        game.gameState.totalCoins -= 50;
        game.levelState.movesLeft += 10;
        game.updatePlayerStats();
        game.updateUI();
        document.getElementById('lose-popup').classList.remove('active');
        game.showNotification('+10 حركات إضافية!', 'success');
    } else {
        game.showNotification('لا يوجد ذهب كافٍ!', 'error');
    }
};

// ============================================
// ملف Manifest للتطبيق التقدمي (PWA)
// ============================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then(
            registration => {
                console.log('ServiceWorker registered:', registration.scope);
            },
            error => {
                console.log('ServiceWorker registration failed:', error);
            }
        );
    });
}

// ============================================
// دعم تثبيت التطبيق
// ============================================
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // عرض زر التثبيت
    const installBtn = document.createElement('button');
    installBtn.textContent = '📲 تثبيت التطبيق';
    installBtn.className = 'game-btn btn-primary';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '20px';
    installBtn.style.left = '50%';
    installBtn.style.transform = 'translateX(-50%)';
    installBtn.style.zIndex = '1000';
    
    installBtn.onclick = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            deferredPrompt = null;
            installBtn.remove();
        }
    };
    
    document.body.appendChild(installBtn);
    
    // إخفاء الزر بعد 30 ثانية
    setTimeout(() => {
        if (installBtn.parentNode) {
            installBtn.remove();
        }
    }, 30000);
});