class Establishment {
    constructor(name, cost, activationNumbers, income, type, isSelfOnly = false) {
        this.name = name;
        this.cost = cost;
        this.activationNumbers = activationNumbers;
        this.income = income;
        this.type = type;
        this.isSelfOnly = isSelfOnly;
    }
}

const firstDeck = [
    ...Array(8).fill(null).flatMap((_, i) => Array(5).fill(`images/${i + 1}.png`)),
    ...Array(2).fill(null).flatMap((_, i) => Array(3).fill(`images/${i + 9}.png`))
];
const secondDeck = [
    ...Array(5).fill(null).flatMap((_, i) => Array(5).fill(`images/${i + 11}.png`)),
    ...Array(5).fill(null).flatMap((_, i) => Array(3).fill(`images/${i + 16}.png`))
];
const thirdDeck = Array.from({ length: 7 }, (_, i) => `images/${i + 21}.png`);

const market1 = document.getElementById('market1');
const market2 = document.getElementById('market2');
const market3 = document.getElementById('market3');
const hand1 = document.getElementById('hand1');
const hand2 = document.getElementById('hand2');
const turnIndicator = document.getElementById('turnIndicator');
const coinsIndicator = document.getElementById('coinsIndicator');
const rollDiceButton = document.getElementById('rollDiceButton');
const rollOneDiceButton = document.getElementById('rollOneDiceButton');
const rollTwoDiceButton = document.getElementById('rollTwoDiceButton');
const skipTurnButton = document.getElementById('skipTurnButton');

const players = [
    { id: 1, name: "Player 1", coins: 5, hand: hand1, establishments: [], landmarks: { "Train Station": false, "Shopping Mall": false, "Amusement Park": false, "Radio Tower": false }, purchaseTurns: 0 },
    { id: 2, name: "Player 2", coins: 5, hand: hand2, establishments: [], landmarks: { "Train Station": false, "Shopping Mall": false, "Amusement Park": false, "Radio Tower": false }, purchaseTurns: 0 }
];

let currentPlayerIndex = 0;
let purchasingPhase = true;

function getCurrentPlayer() {
    return players[currentPlayerIndex];
}

function updateCoinsIndicator() {
    coinsIndicator.innerText = `Player 1: ${players[0].coins} coins | Player 2: ${players[1].coins} coins`;
}

function updateTurnIndicator() {
    const player = getCurrentPlayer();
    turnIndicator.innerText = `Player ${player.id}'s Turn`;
}

function createCardElement(cardImagePath, count = 1) {
    const cardElem = document.createElement('div');
    cardElem.classList.add('card');
    cardElem.dataset.imagePath = cardImagePath;
    cardElem.dataset.count = count;

    const img = document.createElement('img');
    img.src = cardImagePath;
    img.classList.add('card-img');

    const counter = document.createElement('div');
    counter.classList.add('card-counter');
    counter.innerText = count;

    cardElem.appendChild(img);
    cardElem.appendChild(counter);

    return cardElem;
}

function shuffleDeck(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function fillMarket(market, deck) {
    const cardMap = new Map();

    while (market.firstChild) {
        market.removeChild(market.firstChild);
    }

    while (deck.length > 0 && market.children.length < 5) {
        const cardImagePath = deck.pop();
        if (cardMap.has(cardImagePath)) {
            const existingCard = cardMap.get(cardImagePath);
            const counter = existingCard.querySelector('.card-counter');
            counter.innerText = parseInt(counter.innerText) + 1;
            existingCard.dataset.count = parseInt(existingCard.dataset.count) + 1;
        } else {
            const cardElem = createCardElement(cardImagePath);
            cardElem.addEventListener('click', () => purchaseCard(cardElem, cardImagePath, market));
            cardMap.set(cardImagePath, cardElem);
            market.appendChild(cardElem);
        }
    }

    cardMap.forEach((cardElem, cardImagePath) => {
        if (!Array.from(market.children).includes(cardElem)) {
            market.appendChild(cardElem);
        }
    });

    while (market.children.length < 5 && deck.length > 0) {
        const cardImagePath = deck.pop();
        if (!Array.from(market.children).some(child => child.dataset.imagePath === cardImagePath)) {
            const cardElem = createCardElement(cardImagePath);
            cardElem.addEventListener('click', () => purchaseCard(cardElem, cardImagePath, market));
            market.appendChild(cardElem);
        }
    }
}

function purchaseCard(cardElem, cardImagePath, market) {
    const player = getCurrentPlayer();
    const establishment = establishments.find(est => est.imagePath === cardImagePath);
    if (establishment.type === "Landmark") {
        purchaseLandmark(player, establishment);
        switchTurn();
        return;
    }

    if (player.coins < establishment.cost) {
        //alert(`Not enough coins to purchase ${establishment.name}`);
        return;
    }

    player.coins -= establishment.cost;
    player.establishments.push(establishment);

    const existingCard = Array.from(player.hand.children).find(child => child.dataset.imagePath === cardImagePath);

    if (existingCard) {
        const counter = existingCard.querySelector('.card-counter');
        counter.innerText = parseInt(counter.innerText) + 1;
    } else {
        player.hand.appendChild(createCardElement(cardImagePath));
    }

    const cardCount = parseInt(cardElem.dataset.count);
    if (cardCount > 1) {
        cardElem.dataset.count = cardCount - 1;
        const counter = cardElem.querySelector('.card-counter');
        counter.innerText = cardCount - 1;
    } else {
        cardElem.remove();
    }

    // Refill the market
    const deck = market.id === 'market1' ? firstDeck : market.id === 'market2' ? secondDeck : thirdDeck;

    if (deck) {
        while (market.children.length < 5 && deck.length > 0) {
            const newCardImagePath = deck.pop();
            const existingMarketCard = Array.from(market.children).find(child => child.dataset.imagePath === newCardImagePath);
            if (existingMarketCard) {
                const counter = existingMarketCard.querySelector('.card-counter');
                counter.innerText = parseInt(counter.innerText) + 1;
                existingMarketCard.dataset.count = parseInt(existingMarketCard.dataset.count) + 1;
            } else {
                const newCardElem = createCardElement(newCardImagePath);
                newCardElem.addEventListener('click', () => purchaseCard(newCardElem, newCardImagePath, market));
                market.appendChild(newCardElem);
            }
        }
    }
    if (player.id === 1) {
        bot.logPlayerData(player, null, 'purchase', cardImagePath);
    }

    updateCoinsIndicator();
    switchTurn(); 
}

function purchaseLandmark(player, establishment) {
    const playerLandmarks = Object.values(player.landmarks).filter(Boolean).length;
    let cost;

    // landmark cost logic
    if (establishment.name === "French Restaurant") {
        if (playerLandmarks === 0) {
            cost = 10;
        } else if (playerLandmarks === 1) {
            cost = 14;
        } else {
            cost = 22;
        }
    } else if (establishment.name === "Launch Pad") {
        if (playerLandmarks === 0) {
            cost = 45;
        } else if (playerLandmarks === 1) {
            cost = 38;
        } else {
            cost = 25;
        }
    } else {
        if (playerLandmarks === 0) {
            cost = 12;
        } else if (playerLandmarks === 1) {
            cost = 16;
        } else {
            cost = 22;
        }
    }

    if (player.coins < cost) {
        //alert(`Not enough coins to purchase ${establishment.name}. It costs ${cost} coins.`);
        return;
    }

    player.coins -= cost;
    player.landmarks[establishment.name] = true;

    const landmarkElem = createCardElement(establishment.imagePath);
    if (player.id === 1) {
        hand1.appendChild(landmarkElem); 
    } else {
        hand2.appendChild(landmarkElem); 
    }

    bot.logPlayerData(player, null, 'purchase', establishment.imagePath);

    // Replenish the market 
    const deck = thirdDeck;
    const market = market3;

    const landmarkSlot = Array.from(market.children).find(child => child.dataset.imagePath === establishment.imagePath);
    if (landmarkSlot) {
        market.removeChild(landmarkSlot); 
    }

    if (deck.length > 0) {
        const newLandmark = deck.pop();
        const newLandmarkElem = createCardElement(newLandmark);
        market.appendChild(newLandmarkElem);
    }

    //alert(`${player.name} purchased the ${establishment.name} for ${cost} coins!`);

    // Check for victory 
    if (establishment.name === "Launch Pad") {
        bot.logPlayerData(player, null, 'WIN', `Won by purchasing ${establishment.name}`, 0);

        alert(`${player.name} wins by launching the Launch Pad!`);
        bot.exportToCSV();
        startGame();
    } else if (Object.values(player.landmarks).filter(Boolean).length >= 3) {
        bot.logPlayerData(player, null, 'WIN', `Won by purchasing ${establishment.name}`, 0);

        alert(`${player.name} wins by purchasing 3 landmarks!`);
        bot.exportToCSV();
        startGame();
    }

    updateCoinsIndicator();
}



function rollDice() {
    return Math.floor(Math.random() * 6) + 1;
}

function rollTwoDice() {
    return rollDice() + rollDice();
}

function handleComboCard(establishment, player) {
    let cardType = null;

    switch (establishment.name) {
        case 'Flower Shop':
            cardType = 'Flower';
            break;
        case 'Food Warehouse':
            cardType = 'Cafe';
            break;
        case 'Furniture Factory':
            cardType = 'Gear';
            break;
        case 'Winery':
            cardType = 'Fruit';
            break;
        default:
            return; 
    }

    // Combo calculation
    const comboEstablishments = player.establishments.filter(est => est.name === establishment.name);
    let totalBonus = 0;

    comboEstablishments.forEach(comboEst => {
        const typeCount = player.establishments.filter(est => est.type === cardType).length;
        totalBonus += typeCount * comboEst.income;
    });

    if (totalBonus > 0) {
        player.coins += totalBonus;
        //alert(`${player.name} collected ${totalBonus} coins from ${establishment.name} (Combo)`);
    }

    updateCoinsIndicator();
}


function collectIncome(roll, currentPlayer, players, isSelfRoll) {
    const activatedEstablishments = new Set();
    let totalIncome = 0; 

    players.forEach(player => {
        player.establishments.forEach(est => {
            const alreadyActivated = activatedEstablishments.has(`${player.name}-${est.name}`);
            const canActivate = est.activationNumbers.includes(roll) && !alreadyActivated;

            if (canActivate) {
                activatedEstablishments.add(`${player.name}-${est.name}`);
                const estCount = player.establishments.filter(e => e.name === est.name).length;

                if (est.type === 'Cafe' && !isSelfRoll) {
                    const transferAmount = Math.min(est.income * estCount, currentPlayer.coins);
                    currentPlayer.coins -= transferAmount;
                    player.coins += transferAmount;
                    totalIncome += transferAmount; 
                    //alert(`${player.name} collected ${transferAmount} coins from ${currentPlayer.name} due to ${est.name}`);
                } else if (est.type === 'House' && isSelfRoll && player === currentPlayer) {
                    const income = est.income * estCount;
                    player.coins += income;
                    totalIncome += income; 
                    //alert(`${player.name} collected ${income} coins from ${est.name}`);
                } else if (est.type !== 'House' && est.type !== 'Cafe') {
                    if (isSelfRoll && est.type !== 'Combo') {
                        const income = est.income * estCount;
                        player.coins += income;
                        totalIncome += income; 
                        //alert(`${player.name} collected ${income} coins from ${est.name}`);
                    } else if (isSelfRoll && est.type === 'Combo' && player === currentPlayer) {
                        const comboIncome = handleComboCard(est, player); 
                        totalIncome += comboIncome;
                    }
                }

                if (est.type === 'Special' && isSelfRoll && player === currentPlayer) {
                    const opponents = players.filter(p => p !== player);
                    handleSpecialCard(est, player, opponents);
                }
            }
        });
    });

    updateCoinsIndicator();
    return totalIncome; 
}



function handleSpecialCard(establishment, player) {
    const opponent = player.id === 1 ? players[1] : players[0];

    if (establishment.name === 'Business Center') {
        alert('Click on your card to select it for exchange.');

        disableGameInteractions();

        let selectedPlayerCard = null;
        let selectedOpponentCard = null;

        Array.from(player.hand.children).forEach(cardElem => {
            cardElem.addEventListener('click', function selectPlayerCard() {
                if (selectedPlayerCard) {
                    selectedPlayerCard.classList.remove('selected-card');
                }
                selectedPlayerCard = cardElem;
                selectedPlayerCard.classList.add('selected-card');

                alert('Now select a card from an opponent.');

                Array.from(opponent.hand.children).forEach(oppCardElem => {
                    oppCardElem.addEventListener('click', function selectOpponentCard() {
                        if (selectedOpponentCard) {
                            selectedOpponentCard.classList.remove('selected-card');
                        }
                        selectedOpponentCard = oppCardElem;
                        selectedOpponentCard.classList.add('selected-card');

                        swapCards(selectedPlayerCard, selectedOpponentCard, player, opponent);
                        enableGameInteractions();
                    }, { once: true });
                });
            }, { once: true });
        });
    } else if (establishment.name === 'Shopping District') {
        if (opponent.coins > 10) {
            const stolenAmount = Math.floor(opponent.coins / 2);
            opponent.coins -= stolenAmount;
            player.coins += stolenAmount;
            //alert(`${player.name} stole ${stolenAmount} coins from ${opponent.name}`);
        }
        updateCoinsIndicator();
    } else if (establishment.name === 'Stadium') {
        const stolenAmount = Math.min(3, opponent.coins);
        opponent.coins -= stolenAmount;
        player.coins += stolenAmount;
        //alert(`${player.name} took ${stolenAmount} coins from ${opponent.name} due to ${establishment.name}`);
        updateCoinsIndicator();
    }
}



function swapCards(playerCardElem, opponentCardElem, player, opponent) {
    const playerCardIndex = player.establishments.findIndex(est => est.imagePath === playerCardElem.dataset.imagePath);
    const opponentCardIndex = opponent.establishments.findIndex(est => est.imagePath === opponentCardElem.dataset.imagePath);

    const tempCard = player.establishments[playerCardIndex];
    player.establishments[playerCardIndex] = opponent.establishments[opponentCardIndex];
    opponent.establishments[opponentCardIndex] = tempCard;

    const tempElem = document.createElement('div');
    player.hand.replaceChild(tempElem, playerCardElem);
    opponent.hand.replaceChild(playerCardElem, opponentCardElem);
    player.hand.replaceChild(opponentCardElem, tempElem);

    //alert(`${player.name} swapped ${player.establishments[playerCardIndex].name} with ${opponent.name}'s ${opponent.establishments[opponentCardIndex].name}`);
    updateCoinsIndicator();
}

function disableGameInteractions() {
    rollDiceButton.disabled = true;
    rollOneDiceButton.disabled = true;
    rollTwoDiceButton.disabled = true;
    skipTurnButton.disabled = true;
}

function enableGameInteractions() {
    rollDiceButton.disabled = false;
    rollOneDiceButton.disabled = false;
    rollTwoDiceButton.disabled = false;
    skipTurnButton.disabled = false;
}


function switchTurn() {
    const currentPlayer = getCurrentPlayer();

    if (currentPlayer.id === 1) {
        bot.logPlayerData(currentPlayer, null, 'Player 1 Turn End', null);
    }

    currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
    updateTurnIndicator();

    if (getCurrentPlayer().id === 2) {
        setTimeout(() => bot.takeTurn(), 1000); 
    } else {
        nextTurn();
    }
}

function nextTurn() {
    const player = getCurrentPlayer();

    if (player.purchaseTurns < 3) {
        player.purchaseTurns += 1;
    }

    if (player.purchaseTurns >= 3) {
        rollDiceButton.style.display = "block"; 
        skipTurnButton.style.display = "none"; 
    } else {
        rollDiceButton.style.display = "none"; 
        skipTurnButton.style.display = "block"; 
    }

    updateTurnIndicator(); 
}

function rollDicePhase(diceCount) {
    const player = getCurrentPlayer();
    const roll = diceCount === 2 ? rollTwoDice() : rollDice();
    alert(`${player.name} rolled a ${roll}`);

    const initialCoins = player.coins;
    const income = collectIncome(roll, player, players, true); 
    const totalIncome = player.coins - initialCoins + income;

    if (player.id === 1) {
        bot.logPlayerData(player, roll, 'Rolled Dice', null, totalIncome);
    }

    players.forEach(opponent => {
        if (opponent !== player) {
            collectIncome(roll, player, [opponent], false);
        }
    });

    // After rolling and collecting income, purchase or skip
    rollDiceButton.style.display = "none"; 
    rollOneDiceButton.style.display = "none";
    rollTwoDiceButton.style.display = "none";
    skipTurnButton.style.display = "block"; 
}

function startGame() {
    currentPlayerIndex = 0;
    players.forEach((player, index) => {
        player.coins = 5;
        player.establishments = [];
        player.purchaseTurns = 0;

        player.landmarks = {
            "Train Station": false,
            "Shopping Mall": false,
            "Amusement Park": false,
            "Radio Tower": false
        };

        player.hand = index === 0 ? hand1 : hand2;
    });

    // Reinitialize the decks
    firstDeck.length = 0;
    firstDeck.push(...Array(8).fill(null).flatMap((_, i) => Array(5).fill(`images/${i + 1}.png`)),
                  ...Array(2).fill(null).flatMap((_, i) => Array(3).fill(`images/${i + 9}.png`)));

    secondDeck.length = 0;
    secondDeck.push(...Array(5).fill(null).flatMap((_, i) => Array(5).fill(`images/${i + 11}.png`)),
                   ...Array(5).fill(null).flatMap((_, i) => Array(3).fill(`images/${i + 16}.png`)));

    thirdDeck.length = 0;
    thirdDeck.push(...Array.from({ length: 7 }, (_, i) => `images/${i + 21}.png`));

    // Shuffle the decks
    shuffleDeck(firstDeck);
    shuffleDeck(secondDeck);
    shuffleDeck(thirdDeck);

    // Refill the markets
    fillMarket(market1, firstDeck);
    fillMarket(market2, secondDeck);
    fillMarket(market3, thirdDeck);

    while (hand1.firstChild) {
        hand1.removeChild(hand1.firstChild);
    }
    while (hand2.firstChild) {
        hand2.removeChild(hand2.firstChild);
    }

    updateTurnIndicator();
    updateCoinsIndicator();

    rollDiceButton.style.display = "none";
    skipTurnButton.style.display = "block";
    rollOneDiceButton.style.display = "none";
    rollTwoDiceButton.style.display = "none";
}


document.getElementById('playGame').addEventListener('click', startGame);
rollDiceButton.addEventListener('click', () => {
    rollDiceButton.style.display = "none"; 
    rollOneDiceButton.style.display = "block"; 
    rollTwoDiceButton.style.display = "block";
});
rollOneDiceButton.addEventListener('click', () => {
    const roll = rollDice();
    bot.logPlayerData(players[0], roll, 'Rolled Dice');
    rollDicePhase(1);
});
rollTwoDiceButton.addEventListener('click', () => {
    const roll = rollDice();
    bot.logPlayerData(players[0], roll, 'Rolled Dice');
    rollDicePhase(2);
});
skipTurnButton.addEventListener('click', () => {
    switchTurn();
    rollDiceButton.style.display = "block"; 
    skipTurnButton.style.display = "none"; 
});

shuffleDeck(firstDeck);
shuffleDeck(secondDeck);
shuffleDeck(thirdDeck);

const establishments = [
    new Establishment("Wheat Field", 1, [1, 2], 1, 'Wheat'),
    new Establishment("Vineyard", 1, [2], 2, 'Fruit'),
    new Establishment("Cafe", 1, [3], 2, 'Cafe'),
    new Establishment("Flower Garden", 2, [4], 2, 'Flower'),
    new Establishment("Convenience Store", 1, [4], 3, 'House', true),
    new Establishment("Forest", 3, [5], 2, 'Gear'),
    new Establishment("Bakery", 1, [2, 3], 2, 'House', true),
    new Establishment("Sushi Bar", 2, [1], 3, 'Cafe'),
    new Establishment("Flower Shop", 1, [6], 3, 'Combo', true),
    new Establishment("Business Center", 3, [6], 0, 'Special', true),
    new Establishment("Corn Field", 2, [7], 3, 'Wheat'),
    new Establishment("Hamburger Stand", 1, [8], 2, 'Cafe'),
    new Establishment("Family Restaurant", 2, [9, 10], 2, 'Cafe'),
    new Establishment("Apple Orchard", 1, [10], 3, 'Fruit'),
    new Establishment("Mine", 4, [11, 12], 6, 'Gear'),
    new Establishment("Food Warehouse", 2, [10, 11], 2, 'Combo', true),
    new Establishment("Shopping District", 3, [8, 9], 0, 'Special', true),
    new Establishment("Furniture Factory", 4, [8], 4, 'Combo', true),
    new Establishment("Stadium", 3, [7], 0, 'Special', true),
    new Establishment("Winery", 3, [9], 3, 'Combo', true),
    new Establishment("Radio Tower", 12, [], 0, 'Landmark'),
    new Establishment("Exhibit Hall", 12, [], 0, 'Landmark'),
    new Establishment("French Restaurant", 10, [], 0, 'Landmark'),
    new Establishment("Park", 12, [], 0, 'Landmark'),
    new Establishment("Amusement Park", 12, [], 0, 'Landmark'),
    new Establishment("Museum", 12, [], 0, 'Landmark'),
    new Establishment("Launch Pad", 45, [], 0, 'Landmark')
];


establishments.forEach((est, index) => est.imagePath = `images/${index + 1}.png`);


class FSMBot {
    constructor(player) {
        this.player = player;
        this.state = "Buying"; 
        this.turnCount = 0;
        this.playData = []; 
        this.buyingOnlyTurns = 3; 
    }

    logPlayerData(player, diceRoll, action, purchase = null, income = 0) {
        const data = {
            playerId: player.id,
            turnNumber: this.turnCount + 1,
            coins: player.coins,
            totalCards: player.establishments.length, 
            totalLandmarks: Object.keys(player.landmarks).filter(l => player.landmarks[l]).length,
            diceRoll: diceRoll || 'N/A',
            action: action,
            purchase: purchase || 'N/A',
            income: income
        };

        this.playData.push(data);
    }

    exportToCSV() {
        const csvRows = [];
        const headers = ['Player ID', 'Turn Number', 'Coins', 'Total Cards', 'Total Landmarks', 'Dice Roll', 'Action', 'Purchase', 'Income'];
        csvRows.push(headers.join(','));

        this.playData.forEach(row => {
            const values = [
                row.playerId,
                row.turnNumber,
                row.coins,
                row.totalCards,
                row.totalLandmarks,
                row.diceRoll,
                row.action,
                row.purchase,
                row.income
            ];
            csvRows.push(values.join(','));
        });

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `game_play_data.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    takeTurn() {
        if (getCurrentPlayer().id === this.player.id) {
            switch (this.state) {
                case 'Buying':
                    this.buyingState();
                    break;
                case 'RollingDice':
                    this.rollingDiceState();
                    break;
                case 'Purchasing':
                    this.purchasingState();
                    break;
                case 'EndingTurn':
                    this.endingTurnState();
                    break;
                default:
                    console.error('Unknown state:', this.state);
            }
        }
    }

    buyingState() {
        this.logPlayerData(this.player, null, 'Buying Only Turn');

        let purchase = this.buyLandmark();
        let action = 'skip';

        if (!purchase) {
            purchase = this.buyRandomCard();
            action = purchase ? 'purchase' : 'skip';
        }

        this.logPlayerData(this.player, null, action, purchase);

        this.turnCount++;

        if (this.turnCount >= this.buyingOnlyTurns) {
            this.state = "RollingDice"; 
        } else {
            this.state = "EndingTurn"; 
        }

        this.takeTurn();
    }

    rollingDiceState() {
        const diceRoll = Math.random() < 0.5 ? rollDice() : rollTwoDice();
        const initialCoins = this.player.coins;
        alert(`Player 2 rolled a ${diceRoll}`);

        const income = collectIncome(diceRoll, this.player, players, true); 
        const totalIncome = this.player.coins - initialCoins + income; 

        this.logPlayerData(this.player, diceRoll, 'Rolled Dice', null, totalIncome);

        this.state = "Purchasing"; 
        this.takeTurn();
    }

    purchasingState() {
        let purchase = this.buyLandmark();
        let action = 'skip';

        if (!purchase) {
            purchase = this.buyRandomCard();
            action = purchase ? 'purchase' : 'skip';
        }

        this.logPlayerData(this.player, null, action, purchase);

        this.state = "EndingTurn"; 
        this.takeTurn(); 
    }

    endingTurnState() {
        this.logPlayerData(this.player, null, 'End of Turn');

        this.state = "RollingDice"; 
        this.turnCount++;
        switchTurn(); 
    }

    buyRandomCard() {
        const market = [market1, market2, market3];
        let affordableCards = [];

        for (let i = 0; i < market.length; i++) {
            affordableCards = affordableCards.concat(
                Array.from(market[i].children).filter(card => {
                    const establishment = establishments.find(est => est.imagePath === card.dataset.imagePath);
                    return establishment && this.player.coins >= establishment.cost;
                })
            );
        }

        if (affordableCards.length === 0) return null; 

        const randomIndex = Math.floor(Math.random() * affordableCards.length);
        const chosenCard = affordableCards[randomIndex];
        chosenCard.click(); 
        return chosenCard.dataset.imagePath; 
    }

    buyLandmark() {
        const affordableLandmarks = Object.keys(this.player.landmarks).filter(landmark => {
            if (!this.player.landmarks[landmark]) {
                const landmarkEstablishment = establishments.find(est => est.name === landmark);
                return landmarkEstablishment && this.player.coins >= landmarkEstablishment.cost;
            }
            return false;
        });

        const marketLandmarks = Array.from(market3.children).map(card => {
            const establishment = establishments.find(est => est.imagePath === card.dataset.imagePath);
            return establishment ? establishment.name : null;
        });

        const purchasableLandmark = affordableLandmarks.find(landmark => marketLandmarks.includes(landmark));

        if (purchasableLandmark) {
            const landmarkEstablishment = establishments.find(est => est.name === purchasableLandmark);

            if (landmarkEstablishment && landmarkEstablishment.cost) {
                this.player.coins -= landmarkEstablishment.cost;
                this.player.landmarks[purchasableLandmark] = true;

                const landmarkElem = createCardElement(landmarkEstablishment.imagePath);
                hand2.appendChild(landmarkElem);

                this.logPlayerData(this.player, null, 'purchase', landmarkEstablishment.imagePath);

                const landmarkSlot = Array.from(market3.children).find(child => child.dataset.imagePath === landmarkEstablishment.imagePath);
                if (landmarkSlot) {
                    market3.removeChild(landmarkSlot);
                    if (thirdDeck.length > 0) {
                        const newLandmark = thirdDeck.pop();
                        const newLandmarkElem = createCardElement(newLandmark);
                        market3.appendChild(newLandmarkElem);
                    }
                }

                //alert(`Player 2 bought the ${purchasableLandmark}!`);
                return `Bought Landmark: ${purchasableLandmark}`;
            }
        }

        return null;
    }
}

const bot = new FSMBot(players[1]);


// CSV file generator button
const exportButton = document.createElement('button');
exportButton.innerText = "Export Game Play Data to CSV";
exportButton.addEventListener('click', () => bot.exportToCSV());
document.body.appendChild(exportButton);


