/* FHDCC · LittleGame | Copyright (c) 2026 FHDCC (altmanXray) — All Rights Reserved. 个人原创作品，未经授权禁止挪用与二次分发。 */
class GameLobby {
    constructor() {
        this.games = {
            schulte: {
                name: '舒尔特方格',
                path: 'schulte/index.html'
            },
            sudoku: {
                name: '数独',
                path: 'sudoku/index.html'
            },
            memory: {
                name: '记忆翻牌',
                path: 'memory/index.html'
            },
            2048: {
                name: '2048',
                path: '2048/index.html'
            },
            gomoku: {
                name: '五子棋',
                path: 'gomoku/index.html'
            }
        };
        
        this.init();
    }
    
    init() {
        document.querySelectorAll('.game-card:not(.coming-soon)').forEach(card => {
            card.addEventListener('click', () => this.handleGameClick(card));
        });
    }
    
    handleGameClick(card) {
        const gameKey = card.dataset.game;
        const game = this.games[gameKey];
        
        if (game) {
            window.location.href = 'games/' + game.path;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GameLobby();
});

/* FHDCC 控制台签名 */
console.log('%cFHDCC LittleGame %c© 2026 FHDCC · All Rights Reserved', 'font-weight:bold;color:#7c5cff;font-size:14px', 'color:#888');
