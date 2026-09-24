/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
class MemoryGame {
    constructor() {
        this.levels = {
            easy: { label: '简单', columns: 4, pairs: 6 },
            medium: { label: '中等', columns: 4, pairs: 8 },
            hard: { label: '困难', columns: 6, pairs: 12 }
        };
        this.symbols = ['🍎', '🌙', '⭐', '🎵', '🍀', '🧩', '🚀', '🍓', '🎲', '🦋', '🌻', '💎'];
        this.level = 'easy';
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.locked = false;

        this.menuScreen = document.getElementById('menu-screen');
        this.gameScreen = document.getElementById('game-screen');
        this.board = document.getElementById('memory-board');
        this.bestRecord = document.getElementById('best-record');
        this.bestTimeDisplay = document.getElementById('best-time');
        this.timerDisplay = document.getElementById('timer');
        this.timer = new GameTimer(this.timerDisplay);
        this.movesDisplay = document.getElementById('moves');
        this.pairsDisplay = document.getElementById('pairs');
        this.resultModal = document.getElementById('result-modal');
        this.resultSummary = document.getElementById('result-summary');
        this.recordSummary = document.getElementById('record-summary');
        this.startOverlay = document.getElementById('start-overlay');

        this.init();
    }

    init() {
        document.querySelectorAll('.difficulty-btn').forEach(button => {
            button.addEventListener('click', () => this.startGame(button.dataset.level));
        });
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame(this.level));
        document.getElementById('change-level-btn').addEventListener('click', () => this.showMenu());
        this.startOverlay.addEventListener('click', () => this.beginPlay());
        document.querySelectorAll('.return-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => this.returnToLobby());
        });
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.closeModal();
            this.startGame(this.level);
        });
        document.getElementById('modal-menu-btn').addEventListener('click', () => {
            this.closeModal();
            this.showMenu();
        });
        this.resultModal.addEventListener('click', event => {
            if (event.target === this.resultModal) {
                this.closeModal();
            }
        });
        this.updateBestRecord();
    }

    startGame(level) {
        this.level = level;
        const config = this.levels[level];
        this.cards = this.createDeck(config.pairs);
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.locked = true;
        this.menuScreen.style.display = 'none';
        this.gameScreen.style.display = 'block';
        document.querySelector('.container').classList.remove('menu-mode');
        this.resultModal.style.display = 'none';
        this.movesDisplay.textContent = '0';
        this.pairsDisplay.textContent = `0/${config.pairs}`;
        this.timer.reset();
        this.updateGameBest();
        this.renderBoard();
        this.startOverlay.classList.remove('hidden');
    }

    beginPlay() {
        if (this.gameScreen.style.display === 'none') return;
        this.startOverlay.classList.add('hidden');
        this.locked = false;
        this.timer.start();
    }

    updateGameBest() {
        const record = this.readRecord(this.level);
        this.bestTimeDisplay.textContent = record ? GameUtils.formatTimeText(record.ms) : '--';
    }

    createDeck(pairCount) {
        const selected = this.symbols.slice(0, pairCount);
        return this.shuffle([...selected, ...selected]).map((symbol, index) => ({
            id: `${symbol}-${index}`,
            symbol,
            matched: false
        }));
    }

    shuffle(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    renderBoard() {
        this.board.className = `memory-board ${this.level}`;
        this.board.innerHTML = '';
        this.cards.forEach((card, index) => {
            const button = document.createElement('button');
            button.className = 'card';
            button.type = 'button';
            button.dataset.index = index;
            button.setAttribute('aria-label', '未翻开的卡片');
            button.innerHTML = `
                <span class="card-inner">
                    <span class="card-face card-back"></span>
                    <span class="card-face card-front">${card.symbol}</span>
                </span>
            `;
            button.addEventListener('click', () => this.flipCard(index));
            this.board.appendChild(button);
        });
    }

    flipCard(index) {
        if (this.locked) return;
        const card = this.cards[index];
        const element = this.getCardElement(index);
        if (!card || card.matched || element.classList.contains('flipped')) return;

        element.classList.add('flipped');
        element.setAttribute('aria-label', `已翻开：${card.symbol}`);
        AudioManager.play('flip');
        this.flippedCards.push({ card, index });

        if (this.flippedCards.length === 2) {
            this.moves++;
            this.movesDisplay.textContent = this.moves;
            this.checkPair();
        }
    }

    checkPair() {
        const [first, second] = this.flippedCards;
        if (first.card.symbol === second.card.symbol) {
            first.card.matched = true;
            second.card.matched = true;
            this.getCardElement(first.index).classList.add('matched');
            this.getCardElement(second.index).classList.add('matched');
            this.matchedPairs++;
            this.pairsDisplay.textContent = `${this.matchedPairs}/${this.levels[this.level].pairs}`;
            this.flippedCards = [];
            AudioManager.play('success');

            if (this.matchedPairs === this.levels[this.level].pairs) {
                this.finishGame();
            }
            return;
        }

        this.locked = true;
        window.setTimeout(() => {
            this.getCardElement(first.index).classList.remove('flipped');
            this.getCardElement(second.index).classList.remove('flipped');
            this.getCardElement(first.index).setAttribute('aria-label', '未翻开的卡片');
            this.getCardElement(second.index).setAttribute('aria-label', '未翻开的卡片');
            this.flippedCards = [];
            this.locked = false;
        }, 720);
    }

    getCardElement(index) {
        return this.board.querySelector(`.card[data-index="${index}"]`);
    }

    finishGame() {
        this.timer.stop();
        const ms = this.timer.elapsed();
        const recordState = this.saveRecord(ms, this.moves);
        this.resultSummary.textContent = `用时 ${GameUtils.formatTime(ms)} 秒，共 ${this.moves} 步。`;
        this.recordSummary.textContent = recordState;
        this.resultModal.style.display = 'flex';
        this.updateBestRecord();
        this.updateGameBest();

        AudioManager.play('win');
        if (window.LG) {
            LG.Records.add({ game: 'memory', mode: this.level, value: ms, extra: { moves: this.moves } });
            LG.Achievements.report('memory_win', { level: this.level, ms, moves: this.moves });
        }
    }

    saveRecord(ms, moves) {
        const key = this.getRecordKey(this.level);
        const oldRecord = this.readRecord(this.level);
        const current = { ms, moves };

        if (!oldRecord || ms < oldRecord.ms || (ms === oldRecord.ms && moves < oldRecord.moves)) {
            localStorage.setItem(key, JSON.stringify(current));
            return oldRecord ? '刷新了这个难度的最佳记录。' : '这是这个难度的第一条记录。';
        }

        return `最佳记录仍是 ${GameUtils.formatTime(oldRecord.ms)} 秒 · ${oldRecord.moves} 步。`;
    }

    readRecord(level) {
        try {
            const raw = localStorage.getItem(this.getRecordKey(level));
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            return null;
        }
    }

    updateBestRecord() {
        const records = Object.entries(this.levels)
            .map(([level, config]) => ({ config, record: this.readRecord(level) }))
            .filter(item => item.record)
            .map(item => `${item.config.label} ${GameUtils.formatTime(item.record.ms)} 秒 · ${item.record.moves} 步`);

        this.bestRecord.textContent = records.length ? records.join(' / ') : '--';
    }

    getRecordKey(level) {
        return `memory_bestms_${level}`;
    }

    showMenu() {
        this.timer.stop();
        this.gameScreen.style.display = 'none';
        this.menuScreen.style.display = 'block';
        document.querySelector('.container').classList.add('menu-mode');
        this.updateBestRecord();
    }

    closeModal() {
        this.resultModal.style.display = 'none';
    }

    returnToLobby() {
        window.location.href = '../../index.html';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MemoryGame();
});
