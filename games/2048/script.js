class Game2048 {
    constructor() {
        this.size = 4;
        this.board = [];
        this.previousState = null;
        this.score = 0;
        this.bestScore = Number(localStorage.getItem('2048_best_score')) || 0;
        this.won = false;
        this.keepPlaying = false;
        this.touchStart = null;

        this.boardElement = document.getElementById('game-board');
        this.scoreElement = document.getElementById('score');
        this.bestScoreElement = document.getElementById('best-score');
        this.messagePanel = document.getElementById('message-panel');
        this.messageTitle = document.getElementById('message-title');
        this.messageText = document.getElementById('message-text');
        this.continueButton = document.getElementById('continue-btn');
        this.startOverlay = document.getElementById('start-overlay');
        this.started = false;
        this.timer = new GameTimer(document.getElementById('time'));

        this.init();
    }

    init() {
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('message-restart-btn').addEventListener('click', () => this.restart());
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.querySelectorAll('.return-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = '../../index.html';
            });
        });
        this.continueButton.addEventListener('click', () => {
            this.keepPlaying = true;
            this.hideMessage();
        });
        this.startOverlay.addEventListener('click', () => this.start());
        document.querySelectorAll('.direction-btn').forEach(button => {
            button.addEventListener('click', () => this.move(button.dataset.direction));
        });

        window.addEventListener('keydown', event => this.handleKeydown(event));
        this.boardElement.addEventListener('touchstart', event => this.handleTouchStart(event), { passive: true });
        this.boardElement.addEventListener('touchend', event => this.handleTouchEnd(event), { passive: true });

        this.restart();
    }

    restart() {
        this.board = this.createEmptyBoard();
        this.previousState = null;
        this.score = 0;
        this.won = false;
        this.keepPlaying = false;
        this.hideMessage();
        this.addRandomTile();
        this.addRandomTile();
        this.render();
        this.started = false;
        this.startOverlay.classList.remove('hidden');
        this.timer.reset();
    }

    start() {
        this.started = true;
        this.startOverlay.classList.add('hidden');
        this.timer.start();
    }

    createEmptyBoard() {
        return Array.from({ length: this.size }, () => Array(this.size).fill(0));
    }

    addRandomTile() {
        const emptyCells = [];
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                if (this.board[row][col] === 0) {
                    emptyCells.push({ row, col });
                }
            }
        }

        if (!emptyCells.length) return;
        const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.board[cell.row][cell.col] = Math.random() < 0.9 ? 2 : 4;
    }

    handleKeydown(event) {
        const directions = {
            ArrowUp: 'up',
            ArrowDown: 'down',
            ArrowLeft: 'left',
            ArrowRight: 'right'
        };
        const direction = directions[event.key];
        if (!direction) return;
        event.preventDefault();
        this.move(direction);
    }

    handleTouchStart(event) {
        const touch = event.changedTouches[0];
        this.touchStart = { x: touch.clientX, y: touch.clientY };
    }

    handleTouchEnd(event) {
        if (!this.touchStart) return;
        const touch = event.changedTouches[0];
        const dx = touch.clientX - this.touchStart.x;
        const dy = touch.clientY - this.touchStart.y;
        this.touchStart = null;

        if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            this.move(dx > 0 ? 'right' : 'left');
        } else {
            this.move(dy > 0 ? 'down' : 'up');
        }
    }

    move(direction) {
        if (!this.started) return;
        if (this.isGameBlocked()) return;
        const stateBeforeMove = this.snapshot();
        const { board, scoreGain, moved } = this.calculateMove(direction);
        if (!moved) return;

        this.previousState = stateBeforeMove;
        this.board = board;
        this.score += scoreGain;
        this.addRandomTile();
        this.updateBestScore();
        this.render();
        this.checkState();

        if (scoreGain > 0) {
            AudioManager.play('pop');
            const maxTile = Math.max(...this.board.flat());
            if (window.LG && maxTile >= 512) {
                LG.Achievements.report('2048_merge', { tile: maxTile });
            }
        }
    }

    calculateMove(direction) {
        const rotated = this.rotateForDirection(this.board, direction);
        let moved = false;
        let scoreGain = 0;

        const merged = rotated.map(row => {
            const result = this.mergeLine(row);
            if (result.line.some((value, index) => value !== row[index])) {
                moved = true;
            }
            scoreGain += result.scoreGain;
            return result.line;
        });

        return {
            board: this.restoreDirection(merged, direction),
            scoreGain,
            moved
        };
    }

    mergeLine(line) {
        const values = line.filter(Boolean);
        const merged = [];
        let scoreGain = 0;

        for (let i = 0; i < values.length; i++) {
            if (values[i] === values[i + 1]) {
                const value = values[i] * 2;
                merged.push(value);
                scoreGain += value;
                i++;
            } else {
                merged.push(values[i]);
            }
        }

        while (merged.length < this.size) {
            merged.push(0);
        }

        return { line: merged, scoreGain };
    }

    rotateForDirection(board, direction) {
        if (direction === 'left') return board.map(row => [...row]);
        if (direction === 'right') return board.map(row => [...row].reverse());
        if (direction === 'up') return this.transpose(board);
        return this.transpose(board).map(row => row.reverse());
    }

    restoreDirection(board, direction) {
        if (direction === 'left') return board;
        if (direction === 'right') return board.map(row => row.reverse());
        if (direction === 'up') return this.transpose(board);
        return this.transpose(board.map(row => row.reverse()));
    }

    transpose(board) {
        return board[0].map((_, col) => board.map(row => row[col]));
    }

    snapshot() {
        return {
            board: this.board.map(row => [...row]),
            score: this.score,
            won: this.won,
            keepPlaying: this.keepPlaying
        };
    }

    undo() {
        if (!this.previousState) return;
        this.board = this.previousState.board.map(row => [...row]);
        this.score = this.previousState.score;
        this.won = this.previousState.won;
        this.keepPlaying = this.previousState.keepPlaying;
        this.previousState = null;
        this.hideMessage();
        this.render();
    }

    checkState() {
        if (!this.won && this.hasTile(2048)) {
            this.won = true;
            AudioManager.play('win');
            this.showMessage('达成 2048', '你已经合成 2048，可以继续挑战更高分。', true);
            return;
        }

        if (!this.canMove()) {
            this.timer.stop();
            AudioManager.play('lose');
            const maxTile = Math.max(...this.board.flat());
            if (window.LG) {
                LG.Records.add({ game: '2048', mode: 'score', value: this.score });
                LG.Achievements.report('2048_over', { score: this.score, maxTile });
            }
            this.showMessage('游戏结束', `最终分数 ${this.score}。`, false);
        }
    }

    hasTile(value) {
        return this.board.some(row => row.includes(value));
    }

    canMove() {
        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.board[row][col];
                if (value === 0) return true;
                if (row < this.size - 1 && this.board[row + 1][col] === value) return true;
                if (col < this.size - 1 && this.board[row][col + 1] === value) return true;
            }
        }
        return false;
    }

    isGameBlocked() {
        return this.messagePanel.style.display === 'flex' && (!this.won || !this.keepPlaying);
    }

    updateBestScore() {
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('2048_best_score', String(this.bestScore));
        }
    }

    render() {
        this.scoreElement.textContent = this.score;
        this.bestScoreElement.textContent = this.bestScore;
        this.boardElement.innerHTML = '';

        for (let row = 0; row < this.size; row++) {
            for (let col = 0; col < this.size; col++) {
                const value = this.board[row][col];
                const tile = document.createElement('div');
                tile.className = this.getTileClass(value);
                tile.textContent = value || '';
                tile.setAttribute('aria-label', value ? `数字 ${value}` : '空格');
                this.boardElement.appendChild(tile);
            }
        }
    }

    getTileClass(value) {
        if (!value) return 'tile';
        const className = value > 2048 ? 'tile-super' : `tile-${value}`;
        return `tile ${className}`;
    }

    showMessage(title, text, canContinue) {
        this.messageTitle.textContent = title;
        this.messageText.textContent = text;
        this.continueButton.style.display = canContinue ? 'inline-block' : 'none';
        this.messagePanel.style.display = 'flex';
    }

    hideMessage() {
        this.messagePanel.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Game2048();
});
