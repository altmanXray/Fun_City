/* FHDCC · Fun City | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
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
        this.gameActive = false;
        this.startOverlay = document.getElementById('start-overlay');
        this.timer = new GameTimer(document.getElementById('timer'));

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
        
        this.startOverlay.addEventListener('click', () => this.beginPlay());

        this.loadBestRecords();
    }

    startGame(level) {
        this.difficulty = level;
        this.mistakes = 0;
        this.hints = 0;
        this.gameActive = false;
        this.selectedCell = null;

        this.generateSudoku();
        this.renderBoard();
        this.updateUI();
        this.updateHints();
        this.updateNumberPadCounts();
        this.timer.reset();
        this.loadBestRecords();

        document.getElementById('difficulty-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';

        this.startOverlay.classList.remove('hidden');
    }

    beginPlay() {
        if (document.getElementById('game-screen').style.display === 'none') return;
        this.startOverlay.classList.add('hidden');
        this.gameActive = true;
        this.timer.start();
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
        let removed = 0;

        // 安全挖洞：挖掉一格后仍保证唯一解才保留，否则恢复原值。
        // 挖不够目标数时保留更多提示（唯一解优先于难度目标）。
        for (let i = 0; i < shuffled.length && removed < count; i++) {
            const { row, col } = shuffled[i];
            const backup = this.board[row][col];
            this.board[row][col] = 0;

            if (this.countSolutions(this.board, 2) === 1) {
                removed++;
            } else {
                this.board[row][col] = backup;
            }
        }
    }

    countSolutions(board, limit) {
        // 确定性回溯数解器：数满 limit 个解立即剪枝（limit=2 即唯一性判定）
        let count = 0;

        const solve = () => {
            if (count >= limit) return;

            let emptyRow = -1;
            let emptyCol = -1;
            for (let row = 0; row < 9 && emptyRow === -1; row++) {
                for (let col = 0; col < 9; col++) {
                    if (board[row][col] === 0) {
                        emptyRow = row;
                        emptyCol = col;
                        break;
                    }
                }
            }

            if (emptyRow === -1) {
                count++;
                return;
            }

            for (let num = 1; num <= 9; num++) {
                if (this.isValid(board, emptyRow, emptyCol, num)) {
                    board[emptyRow][emptyCol] = num;
                    solve();
                    board[emptyRow][emptyCol] = 0;
                    if (count >= limit) return;
                }
            }
        };

        solve();
        return count;
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
            AudioManager.play('click');

            if (this.checkWin()) {
                this.gameCompleted();
            }
        } else {
            element.textContent = num;
            element.classList.add('user-input', 'error');
            this.board[row][col] = 0;
            this.mistakes++;
            this.updateMistakes();
            AudioManager.play('error');
            
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
        this.timer.stop();

        const ms = this.timer.elapsed();
        const key = `sudoku_bestms_${this.difficulty}`;
        const prev = GameUtils.loadBestTime(key);
        GameUtils.saveBestTime(key, ms);

        const comparisonDiv = document.getElementById('result-comparison');
        const lastResultP = document.getElementById('last-result');

        if (prev !== null) {
            comparisonDiv.style.display = 'block';
            const diff = ms - prev;
            if (diff < 0) {
                lastResultP.innerHTML = `<span class="last-time">上次最佳：${GameUtils.formatTime(prev)} 秒</span><br>
                    <span class="time-change faster">新纪录！快 ${GameUtils.formatTime(-diff)} 秒</span>`;
            } else if (diff > 0) {
                lastResultP.innerHTML = `<span class="last-time">最佳记录：${GameUtils.formatTime(prev)} 秒</span><br>
                    <span class="time-change slower">慢了 ${GameUtils.formatTime(diff)} 秒</span>`;
            } else {
                lastResultP.innerHTML = `<span class="last-time">最佳记录：${GameUtils.formatTime(prev)} 秒</span><br>
                    <span class="time-change same">用时相同！</span>`;
            }
        } else {
            comparisonDiv.style.display = 'none';
        }

        document.getElementById('result-info').textContent = `难度：${this.difficultySettings[this.difficulty].name}`;
        document.getElementById('result-time').textContent = `用时：${GameUtils.formatTime(ms)} 秒`;
        document.getElementById('result-modal').style.display = 'flex';
        this.loadBestRecords();

        AudioManager.play('win');
        if (window.LG) {
            LG.Records.add({ game: 'sudoku', mode: this.difficulty, value: ms });
            LG.Achievements.report('sudoku_win', { difficulty: this.difficulty, ms, hints: this.hints });
        }
    }

    gameOver() {
        this.gameActive = false;
        this.timer.stop();
        document.getElementById('game-over-modal').style.display = 'flex';
        AudioManager.play('lose');
        if (window.LG) {
            LG.Achievements.report('sudoku_lose', {});
        }
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
    
    loadBestRecords() {
        const best = GameUtils.loadBestTime(`sudoku_bestms_${this.difficulty}`);
        const text = GameUtils.formatTimeText(best);
        document.getElementById('best-record').textContent = text;
        const gameBest = document.getElementById('best-time');
        if (gameBest) gameBest.textContent = text;
    }

    restartGame() {
        this.timer.stop();
        this.startGame(this.difficulty);
    }

    returnToDifficulty() {
        this.timer.stop();
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
