// 神経衰弱ゲーム メインスクリプト

// ゲーム設定
const GAME_CONFIG = {
    TIME_LIMIT: 300, // 5分（秒）
    TOTAL_CARDS: 32,
    TOTAL_PAIRS: 16,
    GRID_COLS: 8,
    GRID_ROWS: 4,
    CARD_FLIP_DELAY: 700, // 1秒
    TOTAL_IMAGES: 21
};

// GameController クラス - ゲーム全体の状態管理
class GameController {
    constructor() {
        this.gameState = {
            isPlaying: false,
            timeLimit: GAME_CONFIG.TIME_LIMIT,
            elapsedTime: 0,
            matchedPairs: 0,
            flippedCards: [],
            totalCards: GAME_CONFIG.TOTAL_CARDS,
            canFlip: true
        };

        this.cardManager = new CardManager();
        this.timerManager = new TimerManager(GAME_CONFIG.TIME_LIMIT);
        this.rankingManager = new RankingManager();

        this.initializeEventListeners();
        this.updateDisplay();
    }

    initializeEventListeners() {
        const startBtn = document.getElementById('start-btn');
        const playAgainBtn = document.getElementById('play-again-btn');

        startBtn.addEventListener('click', () => this.startGame());
        playAgainBtn.addEventListener('click', () => this.resetGame());
    }

    startGame() {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput ? nameInput.value.trim() : "";
    
        if (!playerName) {
            alert("名前を入力してください！");
            return;
        }

         // ★ 確認メッセージ
        const confirmStart = confirm(`この名前でスコアが記録されますが、よろしいでしょうか？\n\n【${playerName}】`);
        if (!confirmStart) {
            return;
        }

        console.log('カウントダウン開始');
        this.showCountdown(() => {
            console.log('ゲーム開始');
            this.gameState.isPlaying = true;
            this.gameState.matchedPairs = 0;
            this.gameState.flippedCards = [];
            this.gameState.canFlip = true;
    
            // カードを生成・配置
            this.cardManager.generateCards();
    
            // タイマー開始
            this.timerManager.start(() => {
                this.updateDisplay();
            }, () => {
                this.endGame(false); // 時間切れ
            });
    
            this.updateDisplay();
            this.hideModal();
        });
    }
    
    showCountdown(callback) {
        const overlay = document.getElementById('countdown-overlay');
        overlay.classList.remove('hidden');
        let count = 3;
    
        overlay.textContent = count;
    
        const interval = setInterval(() => {
            count--;
            if (count > 0) {
                overlay.textContent = count;
            } else {
                clearInterval(interval);
                overlay.classList.add('hidden');
                callback(); // カウント終了後にゲーム開始
            }
        }, 1000);
    }
    
    
    endGame(isWin = false) {
        console.log('ゲーム終了:', isWin ? '勝利' : '時間切れ');
        this.gameState.isPlaying = false;
        this.gameState.canFlip = false;

        // タイマー停止
        this.timerManager.stop();

        // スコア記録
        const finalTime = this.timerManager.getElapsedTime();
        this.rankingManager.saveScore(this.gameState.matchedPairs, finalTime);

        // 結果表示
        this.showGameResult(isWin, finalTime);
        this.rankingManager.displayRanking();
    }

    resetGame() {
        console.log('ゲームリセット');
        this.gameState.isPlaying = false;
        this.gameState.matchedPairs = 0;
        this.gameState.flippedCards = [];
        this.gameState.canFlip = true;

        this.timerManager.reset();
        this.cardManager.clearCards();
        this.updateDisplay();
        this.hideModal();
    }

    checkWinCondition() {
        if (this.gameState.matchedPairs >= GAME_CONFIG.TOTAL_PAIRS) {
            this.endGame(true); // 勝利
            return true;
        }
        return false;
    }

    onCardFlipped(card) {
        if (!this.gameState.isPlaying || !this.gameState.canFlip) {
            return;
        }

        this.gameState.flippedCards.push(card);

        if (this.gameState.flippedCards.length === 2) {
            this.gameState.canFlip = false;

            setTimeout(() => {
                const [card1, card2] = this.gameState.flippedCards;
                const isMatch = this.cardManager.checkMatch(card1, card2);

                if (isMatch) {
                    this.cardManager.markAsMatched(card1, card2);
                    this.gameState.matchedPairs++;
                    this.updateDisplay();
                    this.checkWinCondition();
                } else {
                    this.cardManager.resetUnmatchedCards(card1, card2);
                }

                this.gameState.flippedCards = [];
                this.gameState.canFlip = true;
            }, GAME_CONFIG.CARD_FLIP_DELAY);
        }
    }

    updateDisplay() {
        // タイマー表示更新
        const remainingTime = this.timerManager.getRemainingTime();
        const minutes = Math.floor(remainingTime / 60);
        const seconds = remainingTime % 60;
        document.getElementById('timer-display').textContent =
            `Timer: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // スコア表示更新
        document.getElementById('score-display').textContent =
            `Score: ${this.gameState.matchedPairs}/${GAME_CONFIG.TOTAL_PAIRS}`;
    }

    showGameResult(isWin, finalTime) {
        const modal = document.getElementById('game-end-modal');
        const title = document.getElementById('game-result-title');
        const details = document.getElementById('game-result-details');

        title.textContent = isWin ? 'ゲームクリア！' : 'タイムアップ！';

        const minutes = Math.floor(finalTime / 60);
        const seconds = finalTime % 60;
        const timeText = `${minutes}分${seconds}秒`;

        details.innerHTML = `
            <p>揃えたペア数: ${this.gameState.matchedPairs}/${GAME_CONFIG.TOTAL_PAIRS}</p>
            <p>経過時間: ${timeText}</p>
            ${isWin ? '<p style="color: #00b894; font-weight: bold;">おめでとうございます！</p>' :
                '<p style="color: #e17055;">もう一度チャレンジしてみましょう！</p>'}
        `;

        modal.classList.remove('hidden');
    }

    hideModal() {
        document.getElementById('game-end-modal').classList.add('hidden');
    }

    showCountdown(callback) {
        const countdownOverlay = document.getElementById('countdown-overlay');
        let count = 3;
        
        countdownOverlay.classList.remove('hidden');
        countdownOverlay.textContent = count;
        
        const countdownInterval = setInterval(() => {
            count--;
            if (count > 0) {
                countdownOverlay.textContent = count;
            } else if (count === 0) {
                countdownOverlay.textContent = 'START!';
            } else {
                // カウントダウン終了
                clearInterval(countdownInterval);
                countdownOverlay.classList.add('hidden');
                if (callback) callback();
            }
        }, 1000);
    }
}

// 初期化
let gameController;

document.addEventListener('DOMContentLoaded', () => {
    gameController = new GameController();
    console.log('神経衰弱ゲーム初期化完了');
});
// TimerManager クラス - カウントダウンタイマー管理
class TimerManager {
    constructor(timeLimit) {
        this.timeLimit = timeLimit; // 制限時間（秒）
        this.startTime = null;      // ゲーム開始時刻
        this.elapsedTime = 0;       // 経過時間（秒）
        this.intervalId = null;     // setIntervalのID
        this.onUpdate = null;       // 表示更新コールバック
        this.onTimeUp = null;       // 時間切れコールバック
        this.isRunning = false;     // タイマー動作状態
    }

    /**
     * タイマーを開始する
     * @param {Function} updateCallback - 毎秒呼ばれる表示更新コールバック
     * @param {Function} timeUpCallback - 時間切れ時のコールバック
     */
    start(updateCallback, timeUpCallback) {
        if (this.isRunning) {
            console.warn('タイマーは既に動作中です');
            return;
        }

        this.startTime = Date.now();
        this.elapsedTime = 0;
        this.onUpdate = updateCallback;
        this.onTimeUp = timeUpCallback;
        this.isRunning = true;

        // 即座に初回更新を実行
        if (this.onUpdate) {
            this.onUpdate();
        }

        // 1秒ごとにタイマー更新
        this.intervalId = setInterval(() => {
            this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);

            // 残り時間の表示更新
            if (this.onUpdate) {
                this.onUpdate();
            }

            // 制限時間に達した場合のゲーム終了処理
            if (this.elapsedTime >= this.timeLimit) {
                this.stop();
                if (this.onTimeUp) {
                    this.onTimeUp();
                }
            }
        }, 1000);

        console.log(`タイマー開始: ${this.timeLimit}秒`);
    }

    /**
     * タイマーを停止する
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log(`タイマー停止: 経過時間 ${this.elapsedTime}秒`);
    }

    /**
     * タイマーをリセットする
     */
    reset() {
        this.stop();
        this.startTime = null;
        this.elapsedTime = 0;
        this.onUpdate = null;
        this.onTimeUp = null;
        console.log('タイマーリセット');
    }

    /**
     * 経過時間を取得する
     * @returns {number} 経過時間（秒）
     */
    getElapsedTime() {
        if (this.isRunning && this.startTime) {
            // リアルタイムの経過時間を計算
            return Math.floor((Date.now() - this.startTime) / 1000);
        }
        return this.elapsedTime;
    }

    /**
     * 残り時間を取得する
     * @returns {number} 残り時間（秒）
     */
    getRemainingTime() {
        const remaining = this.timeLimit - this.getElapsedTime();
        return Math.max(0, remaining);
    }

    /**
     * タイマーの動作状態を取得する
     * @returns {boolean} 動作中かどうか
     */
    isTimerRunning() {
        return this.isRunning;
    }

    /**
     * 制限時間を変更する（次回ゲーム開始時に適用）
     * @param {number} newTimeLimit - 新しい制限時間（秒）
     */
    setTimeLimit(newTimeLimit) {
        if (typeof newTimeLimit !== 'number' || newTimeLimit <= 0) {
            console.error('制限時間は正の数値である必要があります');
            return;
        }

        this.timeLimit = newTimeLimit;
        console.log(`制限時間を${newTimeLimit}秒に変更しました`);
    }
}

// CardManager クラス - カード生成・配置・めくり処理
class CardManager {
    constructor() {
        this.cards = [];
        this.cardGrid = document.getElementById('card-grid');
    }

    generateCards() {
        // 70枚の画像から16種類をランダム選出
        const selectedImages = this.selectRandomImages(GAME_CONFIG.TOTAL_IMAGES, GAME_CONFIG.TOTAL_PAIRS);

        // 各画像を2枚ずつペアで作成
        this.cards = [];
        selectedImages.forEach((imageId, index) => {
            // 1枚目
            this.cards.push({
                id: `card-${index * 2}`,
                imageId: imageId,
                isFlipped: false,
                isMatched: false,
                position: null
            });

            // 2枚目（ペア）
            this.cards.push({
                id: `card-${index * 2 + 1}`,
                imageId: imageId,
                isFlipped: false,
                isMatched: false,
                position: null
            });
        });

        // カードをシャッフル
        this.shuffleCards();

        // カードを8×4グリッドに配置
        this.placeCardsOnGrid();

        // カードを画面に描画
        this.renderCards();
    }

    selectRandomImages(totalImages, count) {
        const images = [];
        const used = new Set();

        while (images.length < count) {
            const imageId = Math.floor(Math.random() * totalImages) + 1;
            if (!used.has(imageId)) {
                used.add(imageId);
                images.push(imageId);
            }
        }

        return images;
    }

    shuffleCards() {
        // Fisher-Yates シャッフルアルゴリズムでカードの位置をランダムに配置
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

        console.log('カードの位置をランダムにシャッフルしました');
    }

    placeCardsOnGrid() {
        // 32枚のカードを8×4グリッドの各位置に配置
        if (this.cards.length !== GAME_CONFIG.TOTAL_CARDS) {
            console.error(`カード数が正しくありません。期待値: ${GAME_CONFIG.TOTAL_CARDS}, 実際: ${this.cards.length}`);
            return;
        }

        // 各カードにグリッド位置を割り当て
        this.cards.forEach((card, index) => {
            const row = Math.floor(index / GAME_CONFIG.GRID_COLS);
            const col = index % GAME_CONFIG.GRID_COLS;

            card.position = {
                row: row,
                col: col,
                index: index
            };
        });

        console.log(`${GAME_CONFIG.TOTAL_CARDS}枚のカードを${GAME_CONFIG.GRID_COLS}×${GAME_CONFIG.GRID_ROWS}グリッドに配置しました`);
    }

    renderCards() {
        // グリッドをクリア
        this.cardGrid.innerHTML = '';

        // 配置されたカードを画面に描画
        this.cards.forEach((card) => {
            const cardElement = this.createCardElement(card);
            this.cardGrid.appendChild(cardElement);
        });

        console.log(`${this.cards.length}枚のカードをグリッドに描画しました`);
    }

    createCardElement(card) {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'card';
        cardDiv.dataset.cardId = card.id;
        cardDiv.dataset.imageId = card.imageId;

        // グリッド位置をデータ属性として設定
        if (card.position) {
            cardDiv.dataset.row = card.position.row;
            cardDiv.dataset.col = card.position.col;
            cardDiv.dataset.gridIndex = card.position.index;
        }

        // 初期状態でfront-face.pngを表示するカード要素を作成
        cardDiv.innerHTML = `
            <div class="card-inner">
                <div class="card-front">
                    <img src="images/front-face.png" alt="カード表面" onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #74b9ff, #0984e3)';">
                </div>
                <div class="card-back">
                    <img src="images/${card.imageId.toString().padStart(2, '0')}.png" alt="カード${card.imageId}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\\'display:flex;align-items:center;justify-content:center;height:100%;font-size:2rem;color:#666;\\'>${card.imageId}</div>';">
                </div>
            </div>
        `;

        cardDiv.addEventListener('click', () => this.flipCard(card, cardDiv));

        return cardDiv;
    }

    flipCard(card, cardElement) {
        if (card.isFlipped || card.isMatched) return;
        if (!gameController.gameState.canFlip) return; // ★追加

        card.isFlipped = true;
        cardElement.classList.add('flipped');

        if (gameController) {
            gameController.onCardFlipped(card);
        }
    }

    checkMatch(card1, card2) {
        return card1.imageId === card2.imageId;
    }

    resetUnmatchedCards(card1, card2) {
        // カードを裏返す
        card1.isFlipped = false;
        card2.isFlipped = false;

        // DOM要素も更新
        const element1 = document.querySelector(`[data-card-id="${card1.id}"]`);
        const element2 = document.querySelector(`[data-card-id="${card2.id}"]`);

        if (element1) element1.classList.remove('flipped');
        if (element2) element2.classList.remove('flipped');
    }

    markAsMatched(card1, card2) {
        card1.isMatched = true;
        card2.isMatched = true;

        // DOM要素にマッチ状態を反映
        const element1 = document.querySelector(`[data-card-id="${card1.id}"]`);
        const element2 = document.querySelector(`[data-card-id="${card2.id}"]`);

        if (element1) element1.classList.add('matched');
        if (element2) element2.classList.add('matched');
    }

    clearCards() {
        this.cards = [];
        this.cardGrid.innerHTML = '';
    }
}

// RankingManager クラス - スコア保存・表示管理
class RankingManager {
    constructor() {
        this.storageKey = 'memoryGameRanking';
        this.rankingDisplay = document.getElementById('ranking-display');
        this.loadRanking();
    }

    saveScore(pairs, time) {
        const nameInput = document.getElementById('player-name');
        const playerName = nameInput ? nameInput.value.trim() || "名無し" : "名無し";

        const score = {
            name: playerName,    // 名前
            pairs: pairs,
            time: time,
            date: new Date().toLocaleDateString('ja-JP'),
            score: this.calculateScore(pairs, time)
        };

        let rankings = this.getRankings();
        rankings.push(score);

        // ソート: 揃えた枚数を第一基準、時間を第二基準
        rankings.sort((a, b) => {
            if (a.pairs !== b.pairs) {
                return b.pairs - a.pairs;
            }
            return a.time - b.time;
        });

        rankings = rankings.slice(0, 10); // 上位10件のみ

        this.saveRankings(rankings);
    }


    calculateScore(pairs, time) {
        // スコア計算: ペア数 * 100 - 時間（秒）
        return pairs * 100 - time;
    }

    getRankings() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.warn('ランキングデータの読み込みに失敗:', error);
            return [];
        }
    }

    saveRankings(rankings) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(rankings));
        } catch (error) {
            console.warn('ランキングデータの保存に失敗:', error);
        }
    }

    displayRanking() {
        const rankings = this.getRankings();

        if (rankings.length === 0) {
            this.rankingDisplay.innerHTML = '<p style="text-align: center; color: #666;">まだランキングデータがありません</p>';
            return;
        }

        let html = '';
        rankings.forEach((score, index) => {
            const rank = index + 1;
            const minutes = Math.floor(score.time / 60);
            const seconds = score.time % 60;
            const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;

            html += `
    <div class="ranking-item">
        <div>
            <strong>${rank}位</strong>
            <span style="margin-left: 10px;">${score.name}</span>  <!-- ★ 名前表示 -->
            <span style="margin-left: 10px;">${score.pairs}/${GAME_CONFIG.TOTAL_PAIRS}ペア</span>
        </div>
        <div>
            <span>${timeText}</span>
            <span style="margin-left: 10px; color: #666; font-size: 0.9rem;">${score.date}</span>
        </div>
    </div>
`;
        });

        this.rankingDisplay.innerHTML = html;
    }

    loadRanking() {
        this.displayRanking();
    }
}