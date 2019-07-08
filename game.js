// import _ from "https://cdn.jsdelivr.net/npm/lodash-es@4.17.11/lodash.min.js";
import shuffle from "./node_modules/lodash-es/shuffle.js";
import random from "./node_modules/lodash-es/random.js";
import { BigMoneyStrategy, SmartBigMoneyStrategy, SmartDuchyStrategy, SmartSmithyStrategy, BigMoneySmithyStrategy, PointsOnlyStrategy } from "./player-strategies.js";

console.debug = function() {};

export class Player {
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

export class Game {
	/**
	 * @param {any} options Some options to initialize the game
	 * 		- numPlayers: # of players
	 * 		- humanPlayerIndex: index of human player
	 * 		- humanPlayerName: name of human player
	 */
	constructor(options) {
		options = options || {};

		// array of player objects
		this.players = [];

		// map from card names to their quantity in the deck
		this.deck = {};

		// map from card names to their properties
		this.cards = {};

		this.numPlayers = options.numPlayers || 5;
		this.humanPlayerName = options.humanPlayerName || null;

		// humanPlayerIndex may be 0
		if ("humanPlayerIndex" in options) {
			this.humanPlayerIndex = options.humanPlayerIndex;
			this.hasHumanPlayer = true;
		} else {
			this.humanPlayerIndex = -1;
			this.hasHumanPlayer = false;
		}

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
	 * [+number of actions to add, +number of buys to add, +money]
	 */
	smithyCardEffect(playerIndex) {
		for (let i = 0; i < 3; i++) {
			this.drawCard(playerIndex);
		}
		return {
			actions: 0,
			buys: 0,
			money: 0
		};
	}

	/**
	 * +2 cards
	 * +1 action
	 * @param {number} playerIndex
	 * [+number of actions to add, +number of buys to add, +money]
	 */
	laboratoryCardEffect(playerIndex) {
		for (let i = 0; i < 2; i++) {
			this.drawCard(playerIndex);
		}
		return {
			actions: 1,
			buys: 0,
			money: 0
		};
	}

	/**
	 * +2 actions
	 * +1 buy
	 * +2 gold
	 */
	festivalCardEffect() {
		return {
			actions: 2,
			buys: 1,
			gold: 2
		};
	}

	/**
	 * +2 actions
	 * +1 card
	 */
	villageCardEffect(playerIndex) {
		for (let i = 0; i < 1; i++) {
			this.drawCard(playerIndex);
		}
		return {
			actions: 2,
			buys: 0,
			gold: 0
		};
	}

	/**
	 * +1 buy, +2 gold
	 * @param {number} playerIndex
	 */
	woodcutterCardEffect() {
		return {
			actions: 0,
			buys: 0,
			gold: 2
		};
	}

	/**
	 * +1 card, +1 action, +1 buy, +1 gold
	 * @param {number} playerIndex
	 */
	marketCardEffect(playerIndex) {
		for (let i = 0; i < 1; i++) {
			this.drawCard(playerIndex);
		}
		return {
			actions: 1,
			buys: 1,
			gold: 1
		};
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
		cards.curse = {
			name: "curse",
			cost: 0,
			type: "point",
			points: -1,
		};

		// action cards
		const smithy = this.smithyCardEffect.bind(this);
		cards.smithy = {
			name: "smithy",
			cost: 4,
			type: "action",
			effect: smithy,
		};

		const laboratory = this.laboratoryCardEffect.bind(this);
		cards.laboratory = {
			name: "laboratory",
			cost: 5,
			type: "action",
			effect: laboratory
		};

		const festival = this.festivalCardEffect.bind(this);
		cards.festival = {
			name: "festival",
			cost: 5,
			type: "action",
			effect: festival,
		};

		const village = this.villageCardEffect.bind(this);
		cards.village = {
			name: "village",
			cost: 3,
			type: "action",
			effect: village,
		};

		const woodcutter = this.woodcutterCardEffect.bind(this);
		cards.woodcutter = {
			name: "woodcutter",
			cost: 3,
			type: "action",
			effect: woodcutter
		};

		const market = this.marketCardEffect.bind(this);
		cards.market = {
			name: "market",
			cost: 5,
			type: "action",
			effect: market
		};

		// TODO unfinished cards
		cards.cellar = {
			name: "cellar",
			cost: 2,
			type: "action",
			effect: () => {}
		};

		cards.chapel = {
			name: "chapel",
			cost: 2,
			type: "action",
			effect: () => {}
		};

		cards.moat = {
			name: "moat",
			cost: 2,
			type: "action",
			reaction: true,
			effect: () => {}
		};

		cards.merchant = {
			name: "merchant",
			cost: 3,
			type: "action",
			effect: () => {}
		};

		cards.militia = {
			name: "militia",
			cost: 4,
			type: "action",
			attack: true,
			effect: () => {}
		};

		cards.mine = {
			name: "mine",
			cost: 5,
			type: "action",
			effect: () => {}
		};

		cards.remodel = {
			name: "remodel",
			cost: 4,
			type: "action",
			effect: () => {}
		};

		cards.workshop = {
			name: "workshop",
			cost: 3,
			type: "action",
			effect: () => {}
		};

		return cards;
	}

	/**
	 * Initialize mapping of card names to their quantity
	 * @param {number} numPlayers
	 * @returns {object}
	 */
	initDeck(numPlayers) {
		const deck = {};

		// treasure cards
		deck.copper = 60 + numPlayers * 7;
		deck.silver = 40;
		deck.gold = 30;

		// victory cards
		// they have different numbers depending on # of players
		let numVictoryCards;
		if (numPlayers === 2) {
			numVictoryCards = 8;
		} else {
			numVictoryCards = 12;
		}
		let numProvinces = numVictoryCards;
		if (numPlayers === 5) {
			numProvinces = 15;
		} else if (numPlayers === 6) {
			numProvinces = 18;
		}

		deck.estate = numVictoryCards + numPlayers * 3;
		deck.duchy = numVictoryCards;
		deck.province = numProvinces;
		deck.curse = (numPlayers - 1) * 10;

		// kingdom cards - use the Dominion Only initial set
		deck.cellar = 10;
		deck.market = 10;
		deck.merchant = 10;
		deck.militia = 10;
		deck.mine = 10;
		deck.moat = 10;
		deck.remodel = 10;
		deck.smithy = 10;
		// deck.festival = 10;
		// deck.laboratory = 10;
		deck.village = 10;
		deck.woodcutter = 10;

		return deck;
	}

	/**
	 * 1. Initialize player array with AI and strategies
	 * 2. Give players their initial cards (3 estates and 7 coppers) - shuffled
	 */
	initPlayers() {
		// not all of these will play
		const aiPlayers = [
			new Player(
				"Big Money",
				new BigMoneyStrategy()
			),

			new Player(
				"Smart Big Money",
				new SmartBigMoneyStrategy()
			),

			new Player(
				"Big Money with Smithy",
				new BigMoneySmithyStrategy()
			),

			new Player(
				"Smart Smithy",
				new SmartSmithyStrategy()
			),

			new Player(
				"Smart Duchy",
				new SmartDuchyStrategy()
			),

			new Player(
				"Points Only",
				new PointsOnlyStrategy()
			)
		];

		// create generic player objects
		for (let i = 0; i < this.numPlayers; i++) {
			let p;
			if(this.hasHumanPlayer && this.humanPlayerIndex === i) {
				p = new Player(
					this.humanPlayerName,
					null
				);
			} else {
				// inclusive
				let j = random(0, aiPlayers.length - 1);
				p = aiPlayers.splice(j, 1)[0];
			}
			this.players[i] = p;
		}

		// give them their initial cards
		for (let p = 0; p < this.numPlayers; p++) {
			// 3 estates and 7 coppers
			for (let i = 0; i < 3; i++) {
				let card = this.takeCard("estate", p);
				if(!card) {
					throw new Error("took null estate card");
				}
				this.players[p].cards.push(card);
			}
			for (let j = 0; j < 7; j++) {
				let card = this.takeCard("copper", p);
				if(!card) {
					throw new Error("took null copper card");
				}
				this.players[p].cards.push(card);
			}

			// and shuffle
			this.players[p].cards = shuffle(this.players[p].cards);
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
			player.cards = shuffle(player.discard);
			player.discard = [];
		}

		if (player.cards.length === 0) {
			return false;
		}

		const card = player.cards.pop();
		if(!card) {
			throw new Error("Drew null card from the deck");
		}
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
		this.deck = this.initDeck(this.numPlayers);
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

		if(this.turn === this.humanPlayerIndex) {
			throw new Error("Cannot automate human player turn");
		}

		const p = this.turn;
		if (p === 0) {
			this.round++;
			console.debug("");
			console.debug(`******** starting round ${this.round } *************`);
		}

		// draw a card
		this.drawCard(p);

		const player = this.players[p];

		// action phase
		let numActions = 1;
		let bonusMoney = 0;
		let numBuys = 1;

		while (numActions > 0) {
			const action = player.strategy.actionTurn(player);
			if (action != null) {
				console.debug(`Player ${player.name} played action card ${action.name} on round ${this.round}`);
				let cardEffect = action.effect(p);
				numActions += cardEffect.actions;
				numBuys += cardEffect.buys;
				bonusMoney += cardEffect.gold;
			}
			numActions--;
		}

		// TODO: pass numBuys as paramter to strategy?
		// buy phase
		while (numBuys > 0) {
			let cardName = player.strategy.buyTurn(player, this.deck, bonusMoney);
			if (cardName) {
				const money = player.getMoneyInHand();
				console.debug(`Player ${player.name} bought card ${cardName} on round ${this.round} (money ${money})`);
				this.buyCard(cardName, p);
			} else {
				console.debug(`Player ${player.name} does not buy anything this turn`);
			}
			numBuys--;
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
