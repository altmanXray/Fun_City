class SudokuGame {
    constructor() {
        this.board = [];
        this.solution = [];
        this.selectedCell = null;
        this.difficulty = 'easy';
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.hints = 0;
        this.maxHints = 3;
        this.timer = null;
        this.startTime = null;
        this.gameActive = false;
        
        this.difficultySettings = {
            easy: { clues: 40, name: '简单' },
            medium: { clues: 30, name: '中等' },
            hard: { clues: 25, name: '困难' },
            expert: { clues: 20, name: '专家' }
        };
        
        this.init();
    }
    
    init() {
        document.querySelectorAll('.difficulty-btn').forEach(btn => {
            btn.addEventListener('click', () => this.startGame(btn.dataset.level));
        });
        
        document.querySelectorAll('.num-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleNumberInput(btn.dataset.num));
        });
        
        document.getElementById('rules-btn').addEventListener('click', () => this.openRulesModal());
        document.getElementById('close-rules-btn').addEventListener('click', () => this.closeModal('rules-modal'));
        document.getElementById('hint-btn').addEventListener('click', () => this.useHint());
        document.getElementById('restart-btn').addEventListener('click', () => this.restartGame());
        
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => this.returnToDifficulty());
        });
        
        document.querySelectorAll('.return-lobby-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                window.location.href = '../../index.html';
            });
        });
        
        document.getElementById('play-again-btn').addEventListener('click', () => {
            this.closeModal();
            this.restartGame();
        });
        document.getElementById('change-difficulty-btn').addEventListener('click', () => {
            this.closeModal();
            this.returnToDifficulty();
        });
        document.getElementById('try-again-btn').addEventListener('click', () => {
            this.closeModal('game-over-modal');
            this.restartGame();
        });

        document.getElementById('rules-modal').addEventListener('click', (e) => {
            if (e.target.id === 'rules-modal') {
                this.closeModal('rules-modal');
            }
        });
        
        this.loadBestRecords();
    }
    
    startGame(level) {
        this.difficulty = level;
        this.mistakes = 0;
        this.hints = 0;
        this.gameActive = true;
        this.selectedCell = null;
        
        this.generateSudoku();
        this.renderBoard();
        this.updateUI();
        this.updateHints();
        this.updateNumberPadCounts();
        
        document.getElementById('difficulty-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        
        this.startTimer();
    }
    
    generateSudoku() {
        this.solution = this.createValidSudoku();
        this.board = this.copyBoard(this.solution);
        
        const cellsToRemove = 81 - this.difficultySettings[this.difficulty].clues;
        this.removeNumbers(cellsToRemove);
    }
    
    createValidSudoku() {
        const board = Array(9).fill(null).map(() => Array(9).fill(0));
        this.fillBoard(board);
        return board;
    }
    
    fillBoard(board) {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (board[row][col] === 0) {
                    const numbers = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
                    
                    for (const num of numbers) {
                        if (this.isValid(board, row, col, num)) {
                            board[row][col] = num;
                            
                            if (this.fillBoard(board)) {
                                return true;
                            }
                            
                            board[row][col] = 0;
                        }
                    }
                    
                    return false;
                }
            }
        }
        return true;
    }
    
    isValid(board, row, col, num) {
        for (let x = 0; x < 9; x++) {
            if (board[row][x] === num) return false;
        }
        
        for (let x = 0; x < 9; x++) {
            if (board[x][col] === num) return false;
        }
        
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (board[startRow + i][startCol + j] === num) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
    
    copyBoard(board) {
        return board.map(row => [...row]);
    }
    
    removeNumbers(count) {
        const positions = [];
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                positions.push({ row, col });
            }
        }
        
        const shuffled = this.shuffleArray(positions);
        
        for (let i = 0; i < count && i < shuffled.length; i++) {
            const { row, col } = shuffled[i];
            this.board[row][col] = 0;
        }
    }
    
    renderBoard() {
        const boardEl = document.getElementById('sudoku-board');
        boardEl.innerHTML = '';
        
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                if (this.board[row][col] !== 0) {
                    cell.textContent = this.board[row][col];
                    cell.classList.add('fixed');
                }
                
                cell.addEventListener('click', () => this.selectCell(cell));
                boardEl.appendChild(cell);
            }
        }
    }
    
    selectCell(cell) {
        if (!this.gameActive) return;
        
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        if (cell.classList.contains('fixed')) return;
        
        document.querySelectorAll('.cell').forEach(c => {
            c.classList.remove('selected', 'related');
        });
        
        cell.classList.add('selected');
        this.highlightRelated(row, col);
        this.selectedCell = { row, col, element: cell };
    }
    
    highlightRelated(row, col) {
        for (let i = 0; i < 9; i++) {
            document.querySelector(`.cell[data-row="${row}"][data-col="${i}"]`).classList.add('related');
            document.querySelector(`.cell[data-row="${i}"][data-col="${col}"]`).classList.add('related');
        }
        
        const startRow = Math.floor(row / 3) * 3;
        const startCol = Math.floor(col / 3) * 3;
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                document.querySelector(`.cell[data-row="${startRow + i}"][data-col="${startCol + j}"]`).classList.add('related');
            }
        }
    }
    
    handleNumberInput(num) {
        if (!this.gameActive || !this.selectedCell) return;
        
        num = parseInt(num);
        const { row, col, element } = this.selectedCell;
        
        if (element.classList.contains('fixed')) return;
        
        if (num === this.solution[row][col]) {
            element.textContent = num;
            element.classList.add('user-input');
            element.classList.remove('error');
            this.board[row][col] = num;
            this.updateNumberPadCounts();
            
            if (this.checkWin()) {
                this.gameCompleted();
            }
        } else {
            element.textContent = num;
            element.classList.add('user-input', 'error');
            this.board[row][col] = 0;
            this.mistakes++;
            this.updateMistakes();
            
            setTimeout(() => {
                element.textContent = '';
                element.classList.remove('error', 'user-input');
            }, 600);
            
            if (this.mistakes >= this.maxMistakes) {
                this.gameOver();
            }
        }
    }
    
    checkWin() {
        for (let row = 0; row < 9; row++) {
            for (let col = 0; col < 9; col++) {
                if (this.board[row][col] !== this.solution[row][col]) {
                    return false;
                }
            }
        }
        return true;
    }
    
    gameCompleted() {
        this.gameActive = false;
        this.stopTimer();
        
        const time = document.getElementById('timer').textContent;
        const oldRecord = localStorage.getItem(`sudoku_${this.difficulty}`);
        
        this.saveBestRecord();
        
        const comparisonDiv = document.getElementById('result-comparison');
        const lastResultP = document.getElementById('last-result');
        
        if (oldRecord) {
            comparisonDiv.style.display = 'block';
            
            if (time < oldRecord) {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${oldRecord}</span><br>
                    <span class="time-change faster">新纪录！快 ${this.formatTimeDiff(oldRecord, time)}</span>`;
            } else if (time > oldRecord) {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${oldRecord}</span><br>
                    <span class="time-change slower">慢了 ${this.formatTimeDiff(time, oldRecord)}</span>`;
            } else {
                lastResultP.innerHTML = `<span class="last-time">上次用时：${oldRecord}</span><br>
                    <span class="time-change same">用时相同！</span>`;
            }
        } else {
            comparisonDiv.style.display = 'none';
        }
        
        document.getElementById('result-info').textContent = `难度：${this.difficultySettings[this.difficulty].name}`;
        document.getElementById('result-time').textContent = `用时：${time}`;
        document.getElementById('result-modal').style.display = 'flex';
    }
    
    gameOver() {
        this.gameActive = false;
        this.stopTimer();
        document.getElementById('game-over-modal').style.display = 'flex';
    }
    
    useHint() {
        if (!this.gameActive || !this.selectedCell) return;
        if (this.hints >= this.maxHints) return;
        
        const { row, col, element } = this.selectedCell;
        
        if (element.classList.contains('fixed') || element.textContent !== '') return;
        
        const correctNum = this.solution[row][col];
        element.textContent = correctNum;
        element.classList.add('user-input', 'hint');
        this.board[row][col] = correctNum;
        this.hints++;
        this.updateHints();
        this.updateNumberPadCounts();
        
        if (this.checkWin()) {
            this.gameCompleted();
        }
    }
    
    updateUI() {
        document.getElementById('difficulty-display').textContent = 
            this.difficultySettings[this.difficulty].name;
        document.getElementById('mistakes').textContent = 
            `${this.mistakes}/${this.maxMistakes}`;
    }
    
    updateMistakes() {
        document.getElementById('mistakes').textContent = 
            `${this.mistakes}/${this.maxMistakes}`;
    }
    
    updateHints() {
        const hintBtn = document.getElementById('hint-btn');
        if (this.hints >= this.maxHints) {
            hintBtn.textContent = `提示(0)`;
            hintBtn.style.opacity = '0.5';
            hintBtn.style.cursor = 'not-allowed';
        } else {
            hintBtn.textContent = `提示(${this.maxHints - this.hints})`;
            hintBtn.style.opacity = '1';
            hintBtn.style.cursor = 'pointer';
        }
    }

    updateNumberPadCounts() {
        document.querySelectorAll('.num-btn').forEach(btn => {
            const num = parseInt(btn.dataset.num);
            const filledCount = this.board.flat().filter(cell => cell === num).length;
            const remaining = Math.max(0, 9 - filledCount);
            const remainingLabel = btn.querySelector('.num-remaining');

            remainingLabel.textContent = `剩余 ${remaining}`;
            btn.classList.toggle('depleted', remaining === 0);
        });
    }
    
    startTimer() {
        this.startTime = Date.now();
        document.getElementById('timer').textContent = '00:00';
        this.timer = setInterval(() => this.updateTimer(), 1000);
    }
    
    updateTimer() {
        const elapsed = this.getElapsedSeconds();
        document.getElementById('timer').textContent = this.formatTime(elapsed);
    }
    
    getElapsedSeconds() {
        return Math.floor((Date.now() - this.startTime) / 1000);
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    formatTimeDiff(faster, slower) {
        const fParts = faster.split(':').map(Number);
        const sParts = slower.split(':').map(Number);
        const diff = (fParts[0] * 60 + fParts[1]) - (sParts[0] * 60 + sParts[1]);
        if (diff > 0) return `${diff} 秒`;
        return '0 秒';
    }
    
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    saveBestRecord() {
        const currentRecord = localStorage.getItem(`sudoku_${this.difficulty}`);
        const currentTime = document.getElementById('timer').textContent;
        
        if (!currentRecord || currentTime < currentRecord) {
            localStorage.setItem(`sudoku_${this.difficulty}`, currentTime);
        }
        
        this.loadBestRecords();
    }
    
    loadBestRecords() {
        const currentBest = localStorage.getItem(`sudoku_${this.difficulty}`);
        document.getElementById('best-record').textContent = currentBest || '--';
    }
    
    restartGame() {
        this.stopTimer();
        this.startGame(this.difficulty);
    }
    
    returnToDifficulty() {
        this.stopTimer();
        document.getElementById('game-screen').style.display = 'none';
        document.getElementById('difficulty-screen').style.display = 'block';
        this.closeModal('rules-modal');
        this.loadBestRecords();
    }
    
    openRulesModal() {
        document.getElementById('rules-modal').style.display = 'flex';
    }
    
    closeModal(modalId = 'result-modal') {
        document.getElementById(modalId).style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SudokuGame();
});
