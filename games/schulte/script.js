class SchulteGame {
    constructor() {
        this.screens = {
            main: document.getElementById('main-menu'),
            classic: document.getElementById('classic-mode-screen'),
            standard: document.getElementById('standard-mode-screen'),
            poetry: document.getElementById('poetry-mode-screen'),
            game: document.getElementById('game-screen')
        };

        this.gameBoard = document.getElementById('game-board');
        this.targetNumberDisplay = document.getElementById('target-number');
        this.timerDisplay = document.getElementById('timer');
        this.restartBtn = document.getElementById('restart-btn');
        this.poetryDisplay = document.getElementById('poetry-display');
        this.poetryTitle = document.getElementById('poetry-title');
        this.poetryContent = document.getElementById('poetry-content');
        this.poetryList = document.getElementById('poetry-list');
        this.poetryDescription = document.getElementById('poetry-mode-description');

        this.items = [];
        this.currentTarget = 1;
        this.gridSize = 5;
        this.mode = null;
        this.timer = null;
        this.startTime = null;
        this.gameActive = false;
        this.currentPoetry = null;
        this.currentPoetryIndex = 0;
        this.poems = [];

        this.init();
    }

    async init() {
        document.getElementById('classic-mode-btn').addEventListener('click', () => this.showScreen('classic'));
        document.getElementById('standard-mode-btn').addEventListener('click', () => this.showScreen('standard'));
        document.getElementById('poetry-mode-btn').addEventListener('click', () => this.showScreen('poetry'));

        document.getElementById('classic-start-btn').addEventListener('click', () => this.startClassicGame());

        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.showScreen('main'));
        });

        document.querySelectorAll('.return-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = '../../index.html';
            });
        });

        document.querySelectorAll('.start-directly').forEach(btn => {
            btn.addEventListener('click', (e) => this.startStandardGame(e));
        });

        this.restartBtn.addEventListener('click', () => this.restartGame());

        document.getElementById('modal-restart-btn').addEventListener('click', () => {
            document.getElementById('result-modal').style.display = 'none';
            this.restartGame();
        });

        document.getElementById('modal-back-btn').addEventListener('click', () => {
            document.getElementById('result-modal').style.display = 'none';
            window.location.href = '../../index.html';
        });

        document.getElementById('modal-next-btn').addEventListener('click', () => {
            document.getElementById('result-modal').style.display = 'none';

            if (this.mode === 'standard') {
                this.gridSize++;
                this.startGame();
            } else if (this.mode === 'poetry') {
                this.startPoetryGame(this.currentPoetryIndex + 1);
            }
        });

        document.getElementById('result-modal').addEventListener('click', (e) => {
            if (e.target.id === 'result-modal') {
                document.getElementById('result-modal').style.display = 'none';
                this.showScreen('main');
            }
        });

        this.poetryList.innerHTML = '<div class="poetry-empty">正在加载《唐诗三百首》诗库...</div>';
        await this.loadPoems();
        this.renderPoetryList();
    }

    async loadPoems() {
        try {
            const response = await fetch('poems-tang300.json');

            if (!response.ok) {
                throw new Error(`Failed to load poems: ${response.status}`);
            }

            const poems = await response.json();
            this.poems = poems.map((poem, index) => this.normalizePoem(poem, index));
        } catch (error) {
            console.error('唐诗诗库加载失败：', error);
            this.poems = [];
            this.poetryDescription.textContent = '诗库加载失败，请刷新页面后重试。';
            this.poetryList.innerHTML = '<div class="poetry-empty">诗库加载失败，请刷新页面后重试。</div>';
        }
    }

    normalizePoem(poem, index) {
        const paragraphs = Array.isArray(poem.paragraphs) && poem.paragraphs.length > 0
            ? poem.paragraphs
            : [poem.content || ''];

        return {
            id: poem.id || `${poem.title || 'untitled'}-${poem.author || 'unknown'}-${index}`,
            title: poem.title || `未命名诗作 ${index + 1}`,
            author: poem.author || '佚名',
            paragraphs,
            content: paragraphs.join(''),
            pinyin: poem.pinyin || ''
        };
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.style.display = 'none';
        });
        this.screens[screenName].style.display = 'block';

        if (screenName === 'main') {
            this.stopGame();
        }

        if (screenName === 'poetry') {
            this.renderPoetryList();
        }
    }

    startClassicGame() {
        this.mode = 'classic';
        this.gridSize = 5;
        this.startGame();
    }

    startStandardGame(e) {
        const size = parseInt(e.target.dataset.size, 10);
        this.mode = 'standard';
        this.gridSize = size;
        this.startGame();
    }

    renderPoetryList() {
        if (!this.poems.length) {
            if (!this.poetryList.innerHTML.trim()) {
                this.poetryList.innerHTML = '<div class="poetry-empty">暂无可用诗词。</div>';
            }
            return;
        }

        const completedCount = this.poems.filter(poem => this.getPoemStats(poem).completed).length;
        this.poetryDescription.textContent = `已收录 ${this.poems.length} 首，已完成 ${completedCount} 首`;
        this.poetryList.innerHTML = '';

        this.poems.forEach((poem, index) => {
            const stats = this.getPoemStats(poem);
            const item = document.createElement('div');
            item.className = `poetry-item${stats.completed ? ' completed' : ''}`;

            const bestTimeText = stats.bestTime !== null ? `${stats.bestTime.toFixed(2)} 秒` : '--';
            const preview = this.getPoemPreview(poem);

            item.innerHTML = `
                <div class="poetry-item-header">
                    <div class="poetry-item-title">${poem.title}</div>
                    <span class="poetry-status ${stats.completed ? 'done' : 'pending'}">
                        ${stats.completed ? '已完成' : '未完成'}
                    </span>
                </div>
                <div class="poetry-item-author">作者：${poem.author}</div>
                <div class="poetry-item-content">${preview}</div>
                <div class="poetry-item-stats">
                    <span class="poetry-stat">最好成绩：${bestTimeText}</span>
                    <span class="poetry-stat">挑战次数：${stats.attempts} 次</span>
                </div>
            `;

            item.addEventListener('click', () => this.startPoetryGame(index));
            this.poetryList.appendChild(item);
        });
    }

    getPoemPreview(poem) {
        const preview = poem.content.replace(/\s+/g, '');
        return preview.length > 28 ? `${preview.slice(0, 28)}...` : preview;
    }

    startPoetryGame(index) {
        this.mode = 'poetry';
        this.currentPoetryIndex = index;
        this.currentPoetry = this.poems[index];

        if (!this.currentPoetry) {
            return;
        }

        this.recordPoetryAttempt(this.currentPoetry);

        const chars = this.getPoemCharacters(this.currentPoetry);
        const charCount = chars.length;
        const gridWidth = Math.ceil(Math.sqrt(charCount * 1.5));
        this.gridSize = Math.max(3, Math.min(9, gridWidth));

        this.startGame();
    }

    startGame() {
        this.resetGame();
        this.generateItems();
        this.renderBoard();

        if (this.mode === 'poetry') {
            this.poetryDisplay.style.display = 'block';
            this.displayPoetry();
            this.updatePoetryDisplay();
        } else {
            this.poetryDisplay.style.display = 'none';
        }

        this.showScreen('game');
        this.gameActive = true;
        this.startTime = Date.now();
        this.timer = setInterval(() => this.updateTimer(), 10);
    }

    resetGame() {
        this.currentTarget = 1;
        this.targetNumberDisplay.textContent = '1';
        this.timerDisplay.textContent = '0.00';
        this.gameBoard.innerHTML = '';
        this.gameBoard.className = 'game-board';
        this.gameBoard.classList.remove('poetry-mode');

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    stopGame() {
        this.gameActive = false;

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    restartGame() {
        this.stopGame();

        if (this.mode === 'poetry' && this.currentPoetry) {
            this.recordPoetryAttempt(this.currentPoetry);
        }

        this.startGame();
    }

    generateItems() {
        this.items = [];
        const totalItems = this.gridSize * this.gridSize;

        if (this.mode === 'poetry' && this.currentPoetry) {
            const chars = this.getPoemCharacters(this.currentPoetry);

            chars.forEach((char, index) => {
                this.items.push({
                    value: char,
                    order: index + 1
                });
            });
        } else {
            for (let i = 1; i <= totalItems; i++) {
                this.items.push(i);
            }
        }

        this.shuffleArray(this.items);
    }

    getPoemCharacters(poem) {
        return poem.paragraphs.flatMap(line =>
            Array.from(line).filter(char => !this.isPoetryPunctuation(char) && char.trim() !== '')
        );
    }

    isPoetryPunctuation(char) {
        return /[，。！？、；：,.!?;:\s]/.test(char);
    }

    displayPoetry() {
        const hasPinyin = Boolean(this.currentPoetry.pinyin);
        const pinyinChars = hasPinyin
            ? this.currentPoetry.pinyin.replace(/[，。？！、；：]/g, '').split(/\s+/).filter(Boolean)
            : [];

        let order = 1;
        let pinyinIndex = 0;

        const linesHtml = this.currentPoetry.paragraphs.map(line => {
            let lineHtml = '';

            Array.from(line).forEach(char => {
                if (this.isPoetryPunctuation(char)) {
                    lineHtml += `<span class="poetry-punct${hasPinyin ? '' : ' no-pinyin'}">${char}</span>`;
                    return;
                }

                const pinyin = hasPinyin ? (pinyinChars[pinyinIndex] || '') : '';
                const pinyinHtml = pinyin ? `<span class="poetry-pinyin">${pinyin}</span>` : '';
                const wrapperClass = `poetry-char-wrapper${hasPinyin ? '' : ' no-pinyin'}`;

                lineHtml += `
                    <div class="${wrapperClass}" data-order="${order}">
                        ${pinyinHtml}
                        <span class="poetry-char">${char}</span>
                    </div>
                `;

                order++;
                pinyinIndex++;
            });

            return `<div class="poetry-line">${lineHtml}</div>`;
        }).join('');

        this.poetryTitle.innerHTML = `
            <div class="poetry-title-text">${this.currentPoetry.title}</div>
            <div class="poetry-author">${this.currentPoetry.author}</div>
        `;
        this.poetryContent.innerHTML = linesHtml;
    }

    updatePoetryDisplay(target = this.currentTarget) {
        const poetryChars = this.poetryContent.querySelectorAll('.poetry-char-wrapper');

        poetryChars.forEach(charWrapper => {
            const order = parseInt(charWrapper.dataset.order, 10);

            if (order < target) {
                charWrapper.classList.add('found');
                charWrapper.classList.remove('current');
            } else if (order === target) {
                charWrapper.classList.add('current');
                charWrapper.classList.remove('found');
            } else {
                charWrapper.classList.remove('found', 'current');
            }
        });
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    renderBoard() {
        this.gameBoard.classList.add(`grid-${this.gridSize}`);

        if (this.mode === 'poetry') {
            this.gameBoard.classList.add('poetry-mode');
        }

        this.items.forEach(item => {
            const cell = document.createElement('button');
            cell.className = 'cell';

            if (this.mode === 'poetry') {
                cell.textContent = item.value;
                cell.dataset.order = item.order;
            } else {
                cell.textContent = item;
                cell.dataset.number = item;
            }

            cell.addEventListener('click', (e) => this.handleCellClick(e));
            this.gameBoard.appendChild(cell);
        });
    }

    handleCellClick(event) {
        if (!this.gameActive) return;

        const cell = event.target;
        let clickedValue;

        if (this.mode === 'poetry') {
            clickedValue = parseInt(cell.dataset.order, 10);
        } else {
            clickedValue = parseInt(cell.dataset.number, 10);
        }

        const totalItems = this.items.length;

        if (clickedValue === this.currentTarget) {
            cell.classList.add('correct');
            cell.disabled = true;

            if (this.mode === 'poetry') {
                this.updatePoetryDisplay(this.currentTarget + 1);
            }

            if (this.currentTarget === totalItems) {
                this.endGame();
            } else {
                this.currentTarget++;
                this.targetNumberDisplay.textContent = this.currentTarget;
            }
        } else {
            cell.classList.add('wrong');
            setTimeout(() => {
                cell.classList.remove('wrong');
            }, 300);
        }
    }

    updateTimer() {
        const elapsed = Date.now() - this.startTime;
        this.timerDisplay.textContent = (elapsed / 1000).toFixed(2);
    }

    endGame() {
        this.gameActive = false;
        clearInterval(this.timer);

        const finalTime = this.timerDisplay.textContent;
        const finalTimeNum = parseFloat(finalTime);

        let info = '';
        let hasNext = false;
        let gameKey = '';

        if (this.mode === 'standard') {
            info = `标准模式 ${this.gridSize}×${this.gridSize}`;
            gameKey = `schulte_standard_${this.gridSize}`;

            if (this.gridSize < 9) {
                hasNext = true;
            }
        } else if (this.mode === 'classic') {
            info = `经典模式 ${this.gridSize}×${this.gridSize}`;
            gameKey = 'schulte_classic_5';
        } else if (this.mode === 'poetry' && this.currentPoetry) {
            info = `《${this.currentPoetry.title}》\n${this.currentPoetry.author}`;
            gameKey = `schulte_poetry_${this.currentPoetry.id}`;
            hasNext = this.currentPoetryIndex < this.poems.length - 1;
            this.savePoetryCompletion(this.currentPoetry, finalTimeNum);
        }

        document.getElementById('result-info').innerHTML = info;
        document.getElementById('result-time').textContent = `用时：${finalTime} 秒`;

        this.saveAndCompareResult(gameKey, finalTimeNum);

        document.getElementById('modal-next-btn').style.display = hasNext ? 'block' : 'none';
        document.getElementById('result-modal').style.display = 'flex';
    }

    saveAndCompareResult(gameKey, currentTime) {
        const lastResult = localStorage.getItem(gameKey);
        const comparisonDiv = document.getElementById('result-comparison');
        const lastResultP = document.getElementById('last-result');

        if (lastResult) {
            const lastTime = parseFloat(lastResult);
            const diff = lastTime - currentTime;

            comparisonDiv.style.display = 'block';

            if (diff > 0) {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${lastTime.toFixed(2)} 秒</span><br>
                    <span class="time-change faster">快 ${diff.toFixed(2)} 秒</span>`;
            } else if (diff < 0) {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${lastTime.toFixed(2)} 秒</span><br>
                    <span class="time-change slower">慢 ${(-diff).toFixed(2)} 秒</span>`;
            } else {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${lastTime.toFixed(2)} 秒</span><br>
                    <span class="time-change same">用时相同！</span>`;
            }
        } else {
            comparisonDiv.style.display = 'none';
        }

        localStorage.setItem(gameKey, currentTime.toString());
    }

    getPoemStatsKey(poem) {
        return `schulte_poetry_stats_${poem.id}`;
    }

    getPoemStats(poem) {
        const rawStats = localStorage.getItem(this.getPoemStatsKey(poem));

        if (!rawStats) {
            return {
                attempts: 0,
                bestTime: null,
                completed: false,
                completedCount: 0
            };
        }

        try {
            const stats = JSON.parse(rawStats);
            return {
                attempts: Number(stats.attempts) || 0,
                bestTime: Number.isFinite(stats.bestTime) ? stats.bestTime : null,
                completed: Boolean(stats.completed),
                completedCount: Number(stats.completedCount) || 0
            };
        } catch (error) {
            return {
                attempts: 0,
                bestTime: null,
                completed: false,
                completedCount: 0
            };
        }
    }

    setPoemStats(poem, stats) {
        localStorage.setItem(this.getPoemStatsKey(poem), JSON.stringify(stats));
    }

    recordPoetryAttempt(poem) {
        const stats = this.getPoemStats(poem);
        stats.attempts += 1;
        this.setPoemStats(poem, stats);
    }

    savePoetryCompletion(poem, currentTime) {
        const stats = this.getPoemStats(poem);
        stats.completed = true;
        stats.completedCount += 1;

        if (stats.bestTime === null || currentTime < stats.bestTime) {
            stats.bestTime = currentTime;
        }

        this.setPoemStats(poem, stats);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SchulteGame();
});
