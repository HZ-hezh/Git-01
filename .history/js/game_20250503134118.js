// 游戏配置
const gameConfig = {
    maxSlots: 7,         // 底部槽位数量
    cardTypes: 10,       // 卡片类型数量
    matchRequired: 3,    // 需要匹配的相同卡片数量
    levels: [
        { pairs: 5, layers: 2 },  // 第1关：5种卡片类型，2层
        { pairs: 7, layers: 3 },  // 第2关：7种卡片类型，3层
        { pairs: 10, layers: 3 }, // 第3关：10种卡片类型，3层
    ]
};

// 游戏状态
let gameState = {
    level: 1,
    moves: 0,
    cards: [],
    slots: [],
    selectedCards: [],
    isGameOver: false
};

// DOM 元素
const gameBoardEl = document.getElementById('game-board');
const slotsEl = document.getElementById('slots');
const levelEl = document.getElementById('level');
const movesEl = document.getElementById('moves');
const winMovesEl = document.getElementById('win-moves');
const winModal = document.getElementById('win-modal');
const gameOverModal = document.getElementById('game-over-modal');
const restartBtn = document.getElementById('restart-btn');
const nextLevelBtn = document.getElementById('next-level-btn');
const nextLevelModalBtn = document.getElementById('next-level-modal-btn');
const retryBtn = document.getElementById('retry-btn');

// 初始化游戏
function initGame() {
    // 重置游戏状态
    gameState = {
        level: gameState.level || 1,
        moves: 0,
        cards: [],
        slots: Array(gameConfig.maxSlots).fill(null),
        selectedCards: [],
        isGameOver: false
    };

    // 更新UI
    updateUI();
    
    // 创建槽位
    createSlots();
    
    // 生成卡片
    generateCards();
}

// 更新UI显示
function updateUI() {
    levelEl.textContent = gameState.level;
    movesEl.textContent = gameState.moves;
    nextLevelBtn.style.display = 'none';
}

// 创建底部槽位
function createSlots() {
    slotsEl.innerHTML = '';
    
    for (let i = 0; i < gameConfig.maxSlots; i++) {
        const slotEl = document.createElement('div');
        slotEl.className = 'slot';
        slotEl.dataset.index = i;
        slotsEl.appendChild(slotEl);
    }
}

// 生成卡片
function generateCards() {
    gameBoardEl.innerHTML = '';
    gameState.cards = [];
    
    const levelConfig = gameConfig.levels[gameState.level - 1];
    const cardTypes = Math.min(levelConfig.pairs, gameConfig.cardTypes);
    const layers = levelConfig.layers;
    
    // 创建卡片类型数组（每种类型有3张卡片）
    let cardPool = [];
    for (let type = 1; type <= cardTypes; type++) {
        for (let i = 0; i < gameConfig.matchRequired; i++) {
            cardPool.push(type);
        }
    }
    
    // 洗牌算法
    cardPool = shuffleArray(cardPool);
    
    // 计算每层的卡片数量
    const cardsPerLayer = Math.ceil(cardPool.length / layers);
    
    // 创建卡片并放置在游戏板上
    let cardIndex = 0;
    for (let layer = 0; layer < layers; layer++) {
        const layerCards = Math.min(cardsPerLayer, cardPool.length - cardIndex);
        
        for (let i = 0; i < layerCards; i++) {
            if (cardIndex < cardPool.length) {
                createCard(cardPool[cardIndex], layer, i, layerCards, gameBoardEl.clientWidth, gameBoardEl.clientHeight);
                cardIndex++;
            }
        }
    }
}

// 创建单个卡片
function createCard(type, layer, index, layerCards, boardWidth, boardHeight) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = type;
    card.dataset.layer = layer;
    card.textContent = type; // 使用数字作为卡片内容，也可以替换为图标或图片
    
    // 计算卡片位置
    const margin = 10;
    const cardWidth = 60;
    const cardHeight = 80;
    
    // 计算每行可以放置的卡片数量
    const cardsPerRow = Math.floor((boardWidth - margin) / (cardWidth + margin));
    
    // 计算行数
    const rows = Math.ceil(layerCards / cardsPerRow);
    
    // 计算当前卡片的行和列
    const row = Math.floor(index / cardsPerRow);
    const col = index % cardsPerRow;
    
    // 计算左上角位置，添加一些随机偏移
    const offsetX = Math.random() * 20 - 10;
    const offsetY = Math.random() * 20 - 10;
    
    const left = margin + col * (cardWidth + margin) + offsetX;
    const top = margin + row * (cardHeight + margin) + offsetY + (layer * 10); // 每层有一点偏移
    
    // 设置卡片样式
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.zIndex = layer;
    
    // 添加点击事件
    card.addEventListener('click', () => handleCardClick(card));
    
    // 将卡片添加到游戏板和状态中
    gameBoardEl.appendChild(card);
    gameState.cards.push({
        element: card,
        type: type,
        layer: layer,
        isMatched: false
    });
}

// 处理卡片点击
function handleCardClick(card) {
    // 如果游戏已结束或卡片已匹配，则忽略点击
    if (gameState.isGameOver || card.classList.contains('matched')) {
        return;
    }
    
    // 检查卡片是否被其他卡片覆盖
    if (isCardCovered(card)) {
        return;
    }
    
    // 增加步数
    gameState.moves++;
    movesEl.textContent = gameState.moves;
    
    // 选中卡片
    card.classList.add('selected');
    gameState.selectedCards.push(card);
    
    // 检查是否有足够的相同卡片被选中
    checkForMatch();
}

// 检查卡片是否被覆盖
function isCardCovered(card) {
    const cardRect = card.getBoundingClientRect();
    const cardLayer = parseInt(card.dataset.layer);
    
    // 检查所有卡片是否覆盖了当前卡片
    for (const otherCard of gameState.cards) {
        const otherCardEl = otherCard.element;
        
        // 跳过自身、已匹配的卡片和层级较低的卡片
        if (otherCardEl === card || 
            otherCardEl.classList.contains('matched') || 
            parseInt(otherCardEl.dataset.layer) <= cardLayer) {
            continue;
        }
        
        const otherRect = otherCardEl.getBoundingClientRect();
        
        // 检查是否有重叠
        if (!(otherRect.right < cardRect.left || 
              otherRect.left > cardRect.right || 
              otherRect.bottom < cardRect.top || 
              otherRect.top > cardRect.bottom)) {
            // 计算重叠面积
            const overlapX = Math.min(cardRect.right, otherRect.right) - Math.max(cardRect.left, otherRect.left);
            const overlapY = Math.min(cardRect.bottom, otherRect.bottom) - Math.max(cardRect.top, otherRect.top);
            const overlapArea = overlapX * overlapY;
            
            // 如果重叠面积超过卡片面积的30%，则认为被覆盖
            const cardArea = cardRect.width * cardRect.height;
            if (overlapArea > cardArea * 0.3) {
                return true;
            }
        }
    }
    
    return false;
}

// 检查匹配
function checkForMatch() {
    if (gameState.selectedCards.length < gameConfig.matchRequired) {
        return;
    }
    
    // 获取所有选中卡片的类型
    const types = gameState.selectedCards.map(card => card.dataset.type);
    
    // 检查是否所有卡片类型相同
    const allSameType = types.every(type => type === types[0]);
    
    if (allSameType) {
        // 匹配成功，移除卡片
        gameState.selectedCards.forEach(card => {
            card.classList.add('matched');
            setTimeout(() => {
                card.style.display = 'none';
                
                // 更新游戏状态中的卡片
                const cardIndex = gameState.cards.findIndex(c => c.element === card);
                if (cardIndex !== -1) {
                    gameState.cards[cardIndex].isMatched = true;
                }
                
                // 检查是否完成关卡
                checkForLevelComplete();
            }, 500);
        });
    } else {
        // 匹配失败，将卡片移到底部槽位
        moveCardsToSlots();
    }
    
    // 清空选中的卡片
    gameState.selectedCards.forEach(card => card.classList.remove('selected'));
    gameState.selectedCards = [];
}

// 将卡片移到底部槽位
function moveCardsToSlots() {
    for (const card of gameState.selectedCards) {
        // 查找空槽位
        const emptySlotIndex = gameState.slots.findIndex(slot => slot === null);
        
        if (emptySlotIndex !== -1) {
            // 找到空槽位，移动卡片
            const slotEl = document.querySelector(`.slot[data-index="${emptySlotIndex}"]`);
            
            // 克隆卡片并添加到槽位
            const clonedCard = card.cloneNode(true);
            clonedCard.style.position = 'static';
            clonedCard.style.transform = 'none';
            clonedCard.style.margin = '0';
            clonedCard.style.zIndex = '1';
            
            // 移除原始卡片
            card.style.display = 'none';
            const cardIndex = gameState.cards.findIndex(c => c.element === card);
            if (cardIndex !== -1) {
                gameState.cards[cardIndex].isMatched = true;
            }
            
            // 添加到槽位
            slotEl.appendChild(clonedCard);
            gameState.slots[emptySlotIndex] = {
                type: parseInt(card.dataset.type),
                element: clonedCard
            };
            
            // 添加点击事件，允许从槽位中选择卡片
            clonedCard.addEventListener('click', () => handleSlotCardClick(emptySlotIndex));
        } else {
            // 没有空槽位，游戏结束
            gameState.isGameOver = true;
            setTimeout(() => {
                gameOverModal.classList.add('show');
            }, 500);
            return;
        }
    }
    
    // 检查槽位中是否有可以匹配的卡片
    checkSlotsForMatch();
}

// 处理槽位中卡片的点击
function handleSlotCardClick(slotIndex) {
    if (gameState.isGameOver) return;
    
    const slotCard = gameState.slots[slotIndex];
    if (!slotCard) return;
    
    const cardEl = slotCard.element;
    
    // 如果卡片已经被选中，则取消选中
    if (cardEl.classList.contains('selected')) {
        cardEl.classList.remove('selected');
        gameState.selectedCards = gameState.selectedCards.filter(c => c !== cardEl);
        return;
    }
    
    // 选中卡片
    cardEl.classList.add('selected');
    gameState.selectedCards.push(cardEl);
    
    // 检查是否有足够的相同卡片被选中
    if (gameState.selectedCards.length >= gameConfig.matchRequired) {
        checkForMatch();
    }
}

// 检查槽位中是否有可以匹配的卡片
function checkSlotsForMatch() {
    // 统计每种类型的卡片数量
    const typeCounts = {};
    
    for (const slot of gameState.slots) {
        if (slot !== null) {
            const type = slot.type;
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
    }
    
    // 检查是否有足够数量的相同类型卡片
    for (const type in typeCounts) {
        if (typeCounts[type] >= gameConfig.matchRequired) {
            // 有可以匹配的卡片，但不自动匹配，让玩家自己选择
            return;
        }
    }
}

// 检查是否完成关卡
function checkForLevelComplete() {
    // 检查是否所有卡片都已匹配
    const allMatched = gameState.cards.every(card => card.isMatched);
    
    if (allMatched) {
        // 关卡完成
        setTimeout(() => {
            winMovesEl.textContent = gameState.moves;
            winModal.classList.add('show');
            
            // 如果还有下一关，显示下一关按钮
            if (gameState.level < gameConfig.levels.length) {
                nextLevelBtn.style.display = 'block';
            }
        }, 500);
    }
}

// 进入下一关
function nextLevel() {
    // 隐藏模态框
    winModal.classList.remove('show');
    
    // 增加关卡
    gameState.level++;
    
    // 如果已经是最后一关，则循环回第一关
    if (gameState.level > gameConfig.levels.length) {
        gameState.level = 1;
    }
    
    // 重新初始化游戏
    initGame();
}

// 重新开始当前关卡
function restartLevel() {
    gameOverModal.classList.remove('show');
    initGame();
}

// 洗牌算法
function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// 事件监听
restartBtn.addEventListener('click', restartLevel);
nextLevelBtn.addEventListener('click', nextLevel);
nextLevelModalBtn.addEventListener('click', nextLevel);
retryBtn.addEventListener('click', restartLevel);

// 窗口大小改变时重新布局卡片
window.addEventListener('resize', () => {
    // 清空游戏板
    gameBoardEl.innerHTML = '';
    gameState.cards = [];
    
    // 重新生成卡片
    generateCards();
});

// 初始化游戏
document.addEventListener('DOMContentLoaded', initGame);