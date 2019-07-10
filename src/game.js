const _ = require("lodash");
const { BigMoneyStrategy, SmartBigMoneyStrategy, SmartDuchyStrategy, SmartSmithyStrategy, BigMoneySmithyStrategy, PointsOnlyStrategy } = require("./player-strategies.js");

console.debug = function() {};

const Player = require("./player.js");

class Game {
	/**
	 * Game will *automatically* be created with random AI unless the human parameters are passed
	 *
	 * @param {any} options Some options to initialize the game
	 * 		- numPlayers: # of players
	 * 		- humanPlayerIndex: index of human player
	 * 		- humanPlayerName: name of human player
	 * 		- players: array of players to use; length should == numPlayers
	 */
	constructor(options) {
		options = options || {};

		// array of player objects
		this.players = [];

		// map from card names to their quantity in the deck
		this.deck = {};

		// map from card names to their properties
		this.cards = {};

		// array of cards that have been trashed
		this.trash = [];

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

		this.treasurePot = 0;

		/**
		 * There are 4 phases:
		 * - draw
		 * - action
		 * - buy
		 * - cleanup
		 */
		this.phase = "draw";
		this.round = 0;
		this.gameOver = false;

		this.winArr = [];

		this.setup(options.players);
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
			gold: 0
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
			gold: 0
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

	remodelCardEffect() {
		return {
			gainAction: "trash",
			gainBonus: 2
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

	/**
	 * trash 4 cards
	 */
	chapelCardEffect() {
		return {
			actions: 0,
			buys: 0,
			gold: 0,
			// trash up to 4 cards from your hand
			trash: 4
		};
	}

	// gain a card costing up to 4 gold
	workshopCardEffect() {
		return {
			gain: 4
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

		const chapelEffect = this.chapelCardEffect.bind(this);
		cards.chapel = {
			name: "chapel",
			cost: 2,
			type: "action",
			effect: chapelEffect,
		};

		const workshopEffect = this.workshopCardEffect.bind(this);
		cards.workshop = {
			name: "workshop",
			cost: 3,
			type: "action",
			effect: workshopEffect
		};

		const remodelEffect = this.remodelCardEffect.bind(this);
		cards.remodel = {
			name: "remodel",
			cost: 4,
			type: "action",
			effect: remodelEffect
		};

		// TODO unfinished cards

		cards.cellar = {
			name: "cellar",
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

		// const merchantEffect = this.merchantCardEffect.bind(this);
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
		// add a few and ignore a few based on implementation difficulties

		// deck.cellar = 10;
		deck.market = 10;
		deck.merchant = 10;
		// deck.militia = 10;
		deck.mine = 10;
		// deck.moat = 10;
		deck.remodel = 10;
		deck.festival = 10;
		deck.laboratory = 10;
		deck.smithy = 10;
		deck.village = 10;
		deck.woodcutter = 10;
		deck.workshop = 10;

		return deck;
	}

	/**
	 * 1. Initialize player array with AI and strategies
	 * 2. Give players their initial cards (3 estates and 7 coppers) - shuffled
	 *
	 * @param {Player[] | null} players
	 */
	initPlayers(players) {
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
			if (players && players.length > i) {
				p = players[i];
			} else if (this.hasHumanPlayer && this.humanPlayerIndex === i) {
				p = new Player(
					this.humanPlayerName,
					null,
					true
				);
			} else {
				// inclusive
				let j = _.random(0, aiPlayers.length - 1);
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
			this.players[p].cards = _.shuffle(this.players[p].cards);
		}
	}

	/**
	 * Remove card from deck.
	 * @param {string} cardName
	 * @param {number} playerIndex
	 * @returns {Card} card object on success
	 * @throws Error when pile empty
	 */
	takeCard(cardName, playerIndex) {
		if (this.deck[cardName] === 0) {
			throw new Error(`Cannot take ${cardName} from deck, pile empty`);
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
	 * Draw a card from the current player's deck
	 * If the deck is empty, shuffle in cards from discard pile
	 * Transition to the next phase
	 * Initialize numBuys to 1
	 * Initialize numActions to 1
	 * @returns {boolean} Return false iff discard and deck are both empty
	 */
	drawPhase() {
		if(this.phase !== "draw") {
			throw new Error("can only call drawPhase in draw phase");
		}
		const res = this.drawCard(this.turn);
		const player = this.players[this.turn];
		// start out with 1 buy
		player.numBuys = 1;
		player.numActions = 1;
		this.treasurePot = 0;
		this.phase = "action";
		return res;
	}

	/**
	 * End the action phase for the current player
	 * Transition to buy phase
	 * Initializes treasure pot
	 */
	endActionPhase() {
		if(this.phase !== "action") {
			throw new Error(`can only end action phase in action phase, current phase is ${this.phase}`);
		}
		this.phase = "buy";
	}

	/**
	 * NOTE: THIS IS *NOT* THE METHOD TO DRAW CARDS IN THE DRAW PHASE
	 *
	 * Draw a card from the player's deck.
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

	/**
	 * @param {Player[] | null} players
	 */
	setup(players) {
		this.cards = this.initCards();
		this.deck = this.initDeck(this.numPlayers);
		this.initPlayers(players);
		this.dealHands();
	}

	/**
	 * Remove a card from the supply and add it to the player's discard pile
	 * @param {string} cardName
	 * @param {number} playerIndex
	 * @returns {Card}
	 */
	gainCard(cardName, playerIndex) {
		const player = this.players[playerIndex];
		const card = this.takeCard(cardName, playerIndex);
		if (card === null) {
			throw new Error("Failed to take the card from the deck while buying");
		}
		player.discard.push(card);
		return card;
	}

	/**
	 * Buy a card with treasure pot and place it into discard pile
	 * Deduct its cost from treasure pot
	 * Reduce player.numBuys
	 * @param {string} cardName
	 * @param {number} playerIndex
	 * @throws An error on various failures {boolean}
	 */
	buyCard(cardName, playerIndex) {
		if(this.phase !== "buy") {
			throw new Error("cannot buy cards outside of buy phase");
		}
		const card = this.cards[cardName];
		if(this.treasurePot < card.cost) {
			throw new Error(`you cannot afford this card. card costs ${card.cost} but treasure pot only contains ${this.treasurePot}`);
		}

		const player = this.players[playerIndex];
		if(player.numBuys === 0) {
			throw new Error("You have no more buys left!");
		}

		this.treasurePot -= card.cost;

		const c = this.takeCard(cardName, playerIndex);
		if (c === null) {
			throw new Error("Failed to take the card from the deck while buying");
		}
		player.discard.push(c);
		player.numBuys--;
	}

	/**
	 * Current player plays a treasure card
	 * @param {number} cardIndex
	 */
	playTreasureCard(cardIndex) {
		if(this.phase !== "buy") {
			throw new Error("cannot play treasure cards outside the buy phase");
		}
		const player = this.players[this.turn];
		if(player.hand[cardIndex].type !== "treasure") {
			throw new Error(`Card type must be treasure, got ${player.hand[cardIndex].type}`);
		}
		const card = player.hand.splice(cardIndex, 1)[0];
		this.treasurePot += card.value;
		console.debug(`Player ${player.name} played treasure ${card.name}. Treasure pot now ${this.treasurePot}`);
		player.discard.push(card);
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

	/**
	 * Change the phase to cleanup, then to buy
	 * Perform the cleanup phase for the current player
	 * Change the turn to the next player
	 */
	endTurn() {
		if(this.phase !== "buy") {
			console.warn(`cannot end turn in ${this.phase} phase`);
		}

		this.phase = "cleanup";

		this.players[this.turn].numActions = 0;
		this.players[this.turn].numBuys = 0;

		// cleanup phase: discard whole hand
		while (this.players[this.turn].hand.length > 0) {
			const c = this.players[this.turn].hand.pop();
			this.players[this.turn].discard.push(c);
		}

		// draw 5 new cards
		for (let i = 0; i < 5; i++) {
			this.drawCard(this.turn);
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

		this.phase = "draw";
	}

	/**
	 * Trash the given cards from that player
	 *
	 * @param {Player} player
	 * @param {number[]} cardIndexes
	 * @returns {Card[]} trashed cards
	 */
	trashCards(player, cardIndexes) {
		const trashed = [];
		// sort in reverse order to not mess up indexing
		cardIndexes.sort((a, b) => {
			return b - a;
		});
		for(let cardIndex of cardIndexes) {
			const card = player.hand.splice(cardIndex, 1)[0];
			console.debug(`Player ${player.name} trashed card ${card.name}`);
			this.trash.push(card);
			trashed.push(card);
		}
		return trashed;
	}

	/**
	 * Processes the effect of the card
	 * Puts the card in the discard pile
	 * -- numActions for the player
	 * @param {Player} player
	 * @param {number} playerIndex
	 * @param {Card} card
	 * @returns {any} Effect of the card
	 */
	playActionCard(player, playerIndex, card) {
		if(this.phase !== "action") {
			throw new Error("cannot play action cards outside of action phase");
		}
		const cardEffect = card.effect(playerIndex);
		if(!cardEffect) {
			console.log(card);
			console.error("Failed to find effect for card ^");
		}
		player.numActions += cardEffect.actions || 0;
		player.numBuys += cardEffect.buys || 0;
		this.treasurePot += cardEffect.gold || 0;

		// remove element from hand and place it on the discard pile
		let cardIndex;
		for(let i = 0; i < player.hand.length; i++) {
			if(card === player.hand[i]) {
				cardIndex = i;
				break;
			}
		}
		player.hand.splice(cardIndex, 1)[0];
		player.discard.push(card);

		player.numActions--;
		return cardEffect;
	}

	/**
	 * @param {Player} player
	 * @param {string} cardName
	 * @param {number} maxGainCost
	 * @returns {boolean}
	 */
	/*
	canGainCard(player, cardName, maxGainCost) {
		if(this.deck[cardName] === 0) {
			return false;
		}
		let gainCard = this.cards[cardName];
		if(gainCard.cost > maxGainCost) {
			// throw new Error(`Card allowed you to gain a card costing up to ${maxGainCost} but you tried to gain a card costing ${gainCard.cost}`);
			return false;
		}
	}
	*/

	doTurn() {
		if (this.gameOver) {
			return;
		}

		if(this.turn === this.humanPlayerIndex) {
			throw new Error("Cannot automate human player turn");
		}

		if(this.phase !== "draw") {
			throw new Error(`Cannot call doTurn in phase ${this.phase}`);
		}

		const p = this.turn;
		if (p === 0) {
			this.round++;
			console.debug("");
			console.debug(`******** starting round ${this.round } *************`);
		}

		// draw a card and automatically transition to next phase
		this.drawPhase();

		const player = this.players[p];

		while (player.numActions > 0) {
			const card = player.strategy.actionTurn(player);
			if (card) {
				console.debug(`Player ${player.name} played action card ${card.name} on round ${this.round}`);
				const effect = this.playActionCard(player, p, card);
				if(effect.trash) {
					const trashCards = player.strategy.trashCards(player, effect.trash);
					this.trashCards(player, trashCards);
				}
				if(effect.gain) {
					const gainCardName = player.strategy.gainCard(player, effect.gain);
					if(gainCardName) {
						let card = this.cards[gainCardName];
						if(card.cost > effect.gain) {
							throw new Error(`Card allowed you to gain a card costing up to ${effect.gain} but you tried to gain a card costing ${gainCard.cost}`);
						}
						console.debug(`Player ${player.name} gained card ${gainCardName}`);
						this.gainCard(gainCardName, p);
					}
				}
				if(effect.gainAction) {
					if(effect.gainAction === "trash") {
						let o = player.strategy.trashCardForGain(
							player,
							effect.gainBonus,
							effect.gainTrashCategory
						);
						if(o) {
							let trashedCards = this.trashCards(player, o.trashCards);
							let maxGainCost = effect.gainBonus;
							for(let card of trashedCards) {
								maxGainCost += card.cost;
							}
							let gainCard = this.cards[o.gainCardName];
							if(gainCard.cost > maxGainCost) {
								throw new Error(`Card allowed you to gain a card costing up to ${maxGainCost} but you tried to gain a card costing ${gainCard.cost}`);
							}
							this.gainCard(o.gainCardName, p);
						}
					} else {
						throw new Error("not implemented");
					}
				}
			} else {
				break;
			}
		}

		this.endActionPhase();

		// buy phase
		while (player.numBuys > 0) {
			let treasureCards = player.strategy.playTreasures(player, this.deck, this.treasurePot);
			// sort in reverse order, in place
			// reverse order to keep indexes valid
			treasureCards.sort((a, b) => {
				return b - a;
			});
			for(let cardIndex of treasureCards) {
				this.playTreasureCard(cardIndex);
			}

			let cardName = player.strategy.buyTurn(player, this.deck, this.treasurePot);
			if (cardName) {
				// numBuys deducted here
				this.buyCard(cardName, p);
				console.debug(`Player ${player.name} bought card ${cardName} on round ${this.round} (treasure pot now ${this.treasurePot})`);
			} else {
				console.debug(`Player ${player.name} does not buy anything this turn`);
				break;
			}
		}

		this.endTurn();
	}
}

module.exports = Game;