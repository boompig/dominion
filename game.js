/* global BigMoneyStrategy, SmartBigMoneyStrategy, BigMoneySmithyStrategy, SmartSmithyStrategy, SmartDuchyStrategy, _ */

if(typeof(module) !== "undefined" && typeof(require) !== "undefined") {
	// using var here because we want this to work both in browser and in command-line mode
	// var allows these variables to move out of the scope of this if-statement

	// eslint-disable-next-line
	var _ = require("lodash");
	// eslint-disable-next-line
	var { BigMoneyStrategy, SmartBigMoneyStrategy, SmartDuchyStrategy, SmartSmithyStrategy, BigMoneySmithyStrategy } = require("./player-strategies");
}

console.debug = function() {};

class Player {
	/**
	 * @param {String} name
	 * @param {PlayerStrategy} strategy
	 */
	constructor(name, strategy) {
		this.name = name;
		this.strategy = strategy;
		this.cards = [];
		this.hand = [];
		this.discard = [];
		this.points = 0;
	}

	/**
	 * @returns {number}
	 */
	getMoneyInHand() {
		let money = 0;
		for (let i = 0; i < this.hand.length; i++) {
			if (this.hand[i].type === "treasure") {
				money += this.hand[i].value;
			}
		}
		return money;
	}
}

class Game {
	constructor() {
		// array of player objects
		this.players = [];

		// map from card names to their quantity in the deck
		this.deck = {};

		// map from card names to their properties
		this.cards = {};

		this.numPlayers = 0;

		// index into this.players
		this.turn = 0;

		this.round = 0;
		this.gameOver = false;

		this.winArr = [];

		this.setup();
	}

	/** *************** CARD EFFECTS **************** */

	/**
	 * Draw 3 cards
	 * @param {number} playerIndex
	 */
	smithyCardEffect(playerIndex) {
		// draw 3 cards

		for (let i = 0; i < 3; i++) {
			this.drawCard(playerIndex);
		}
	}
	/** ********************************************* */

	/**
	 * Initialize mapping of card names to cards.
	 */
	initCards() {
		const cards = {};

		// treasures
		cards.copper = {
			name: "copper",
			cost: 0,
			type: "treasure",
			value: 1,
		};
		cards.silver = {
			name: "silver",
			cost: 3,
			type: "treasure",
			value: 2,
		};
		cards.gold = {
			name: "gold",
			cost: 6,
			type: "treasure",
			value: 3,
		};

		// point cards
		cards.estate = {
			name: "estate",
			cost: 2,
			type: "point",
			points: 1,
		};
		cards.duchy = {
			name: "duchy",
			cost: 5,
			type: "point",
			points: 3,
		};
		cards.province = {
			name: "province",
			cost: 8,
			type: "point",
			points: 6,
		};

		let f = this.smithyCardEffect.bind(this);

		cards.smithy = {
			name: "smithy",
			cost: 4,
			type: "action",
			effect: f,
		};

		return cards;
	}

	/**
	 * Initialize mapping of card names to their quantity
	 * @returns {object}
	 */
	initDeck() {
		const deck = {};
		// just some numbers...
		deck.copper = 60;
		deck.silver = 40;
		deck.gold = 30;

		deck.estate = 20;
		deck.duchy = 12;
		deck.province = 12;

		deck.smithy = 10;
		return deck;
	}

	/**
	 * 1. Set numPlayers
	 * 2. Initialize player array with AI and strategies
	 * 3. Give players their initial cards (3 estates and 7 coppers) - shuffled
	 */
	initPlayers() {
		this.numPlayers = 5;

		// create generic player objects
		for (let i = 0; i < this.numPlayers; i++) {
			this.players[i] = {
				cards: [],
				hand: [],
				discard: [],
				points: 0,
			};
		}

		// specialize them with strategy
		this.players[0] = new Player(
			"Big Money",
			new BigMoneyStrategy()
		);

		this.players[1] = new Player(
			"Smart Big Money",
			new SmartBigMoneyStrategy()
		);

		this.players[2] = new Player(
			"Big Money with Smithy",
			new BigMoneySmithyStrategy()
		);

		this.players[3] = new Player(
			"Smart Smithy",
			new SmartSmithyStrategy()
		);

		this.players[4] = new Player(
			"Smart Duchy",
			new SmartDuchyStrategy()
		);

		// give them their initial cards
		for (let p = 0; p < this.numPlayers; p++) {
			// 3 estates and 7 coppers
			for (let i = 0; i < 3; i++) {
				let card = this.takeCard("estate", p);
				this.players[p].cards.push(card);
			}
			for (let j = 0; j < 7; j++) {
				let card = this.takeCard("copper", p);
				this.players[p].cards.push(card);
			}

			// and shuffle
			this.players[p].cards = _.shuffle(this.players[p].cards);
		}
	}

	/**
	 * Remove card from deck.
	 * @param {string} cardName
	 * @param {number} playerIndex
	 * @returns {string | null} Return null on failure, card on success
	 */
	takeCard(cardName, playerIndex) {
		if (this.deck[cardName] === 0) {
			return null;
		}
		const player = this.players[playerIndex];

		this.deck[cardName]--;
		const card = this.cards[cardName];

		// points are added on here
		if (card.type === "point") {
			player.points += card.points;
		}

		return card;
	}

	/**
	 * Draw a card from the player's deck deck.
	 * If the deck is empty, shuffle in cards from discard pile
	 * @param {number} playerIndex
	 * @returns {boolean} Return false iff discard and deck are both empty
	 */
	drawCard(playerIndex) {
		const player = this.players[playerIndex];
		if (player.cards.length === 0) {
			// the player has run out of cards
			// set the player's cards as a shuffled version of their discard pile
			player.cards = _.shuffle(player.discard);
			player.discard = [];
		}

		if (player.cards.length === 0) {
			return false;
		}

		const card = player.cards.pop();
		player.hand.push(card);

		return true;
	}

	dealHands() {
		for (let p = 0; p < this.numPlayers; p++) {
			for (let i = 0; i < 5; i++) {
				this.drawCard(p);
			}
		}
	}

	setup() {
		this.cards = this.initCards();
		this.deck = this.initDeck();
		this.initPlayers();
		this.dealHands();
	}

	/**
	 * Return true iff successful (enough cards remaining)
	 * No honesty check
	 * @param {string} cardName
	 * @param {number} playerIndex
	 * @returns {boolean}
	 */
	buyCard(cardName, playerIndex) {
		// TODO for now assume players are honest and have enough money to buy

		const card = this.takeCard(cardName, playerIndex);
		if (card === null) {
			return false;
		}
		this.players[playerIndex].discard.push(card);
		return true;
	}

	/**
	 * For now, this only checks the province pile
	 * @returns {boolean}
	 */
	checkGameEnd() {
		return this.deck.province === 0;
	}

	/**
	 * Run the game to completion. If the game is over, return the winning players
	 */
	playGame() {
		while (!this.gameOver) {
			this.doTurn();
		}
		return this.winArr;
	}

	doTurn() {
		if (this.gameOver) {
			return;
		}

		const p = this.turn;
		if (p === 0) {
			this.round++;
			console.debug("");
			console.debug(`******** starting round ${this.round } *************`);
		}

		// draw a card
		this.drawCard(p);

		// action phase
		const player = this.players[p];
		const action = player.strategy.actionTurn(player);
		if (action != null) {
			console.debug(`Player ${player.name} played action card ${action.name} on round ${this.round}`);
			action.effect(p);
		}

		// buy phase
		const cardName = player.strategy.buyTurn(player, this.deck);
		if (cardName) {
			const money = player.getMoneyInHand();
			console.debug(`Player ${player.name} bought card ${cardName} on round ${this.round} (money ${money})`);
			this.buyCard(cardName, p);
		} else {
			console.debug(`Player ${player.name} does not buy anything this turn`);
		}

		// cleanup phase: discard whole hand
		while (this.players[p].hand.length > 0) {
			const c = this.players[p].hand.pop();
			this.players[p].discard.push(c);
		}

		// draw 5 new cards
		for (let i = 0; i < 5; i++) {
			this.drawCard(p);
		}

		if (this.checkGameEnd()) {
			this.gameOver = true;

			let bestScore = 0;

			for (let i = 0; i < this.numPlayers; i++) {
				bestScore = Math.max(this.players[i].points, bestScore);
			}

			console.debug("**** game over ****");
			console.debug(`best score = ${bestScore}`);

			this.winArr = [];

			for (let i = 0; i < this.numPlayers; i++) {
				if (this.players[i].points === bestScore) {
					this.winArr.push(this.players[i]);
				}
			}
		} else {
			this.turn = (this.turn + 1) % this.numPlayers;
		}
	}
}

if(typeof(module) !== "undefined") {
	// eslint-disable-next-line
	module.exports = Game;
}