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