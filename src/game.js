const _ = require("lodash");
const { BigMoneyStrategy, SmartBigMoneyStrategy, SmartDuchyStrategy, SmartSmithyStrategy, BigMoneySmithyStrategy, PointsOnlyStrategy } = require("./player-strategies.js");

// for debugging
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
	 * 		- supplyCards: array of strings of cards to include in supply. can be any length and automatically filled to 10 randomly
	 */
	constructor(options) {
		options = options || {};

		// array of player objects
		this.players = [];

		// map from card names to their quantity in the deck
		this.supply = {};

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
		this.firstPlayBonus = {};

		/**
		 * There are 4 phases:
		 * - draw
		 * - action
		 * - buy
		 * - cleanup
		 *
		 * other phases are enabled via action cards:
		 * - gain
		 * - trash
		 * - discard
		 * - discard-deck
		 * - adventurer
		 * - spy
		 * - thief
		 */
		this.phase = "draw";
		this.endPhaseCallback = null;
		this.round = 0;
		this.isGameOver = false;
		this.playArea = [];

		// gain-phase specific
		this.maxGainCost = 0;
		this.gainType = null;
		// trash-phase specific
		this.numTrash = 0;
		this.trashType = null;
		this.trashName = null;
		// discard-phase specific
		this.numDiscard = 0;
		this.discardType = null;
		this.discardRange = null;
		// this is a little hack to make sure action stack cleaned up only when all card effects are processed
		this.canCleanupActionStack = true;

		this.winArr = [];

		this.setup(options.players, options.supplyCards);
	}

	/** *************** CARD EFFECTS **************** */

	/*
	 * The way this section works is each card has a few numerical effects
	 * It only works for cards with straightforward effects
	 *
	 * First, the effect is called. It's a callable that takes `playerIndex` parameter
	 * Second, the effect returns the resultant change to the player as a dictionary of numbers
	 *
	 * - actions: + how many actions
	 * - buys: + how many buys
	 * - gold: + how much gold/money
	 * - trash: how many cards you may trash (up to)
	 * - gainAction: what you must do to gain a card
	 * - gainBonus: in addition to the value of the card(s) discarded or trashed, how much money is added to gain
	 * - gain: maximum value of card to gain
	 */

	/**
	 * Draw 3 cards
	 * @param {number} playerIndex
	 */
	smithyCardEffect(playerIndex) {
		this.drawCards(playerIndex, 3);
		return {};
	}

	/**
	 * +1 Card; +1 Action
	 * Each player (including you)
	 * reveals the top card of his deck and either discards it or puts it back, your choice.
	 */
	spyCardEffect(playerIndex) {
		// +1 card
		this.drawCards(playerIndex, 1);
		// reveal 1 card for each player
		for(let i = 0; i < this.numPlayers; i++) {
			this.drawCard(i, true);
		}
		this.changePhaseUsingActionCard("spy", {},
			/**
			 * After playing the spy card (in the spy phase) can set the spy choice
			 * Acceptable choices are "discard" and "deck"
			 * @param {any} choices Map from player index to choice: "discard" or "deck"
			 */
			(spyChoices) => {
				if (!spyChoices) {
					throw new Error("Spy choices expected in spy callback to endActionCardPhase");
				}

				for (let i = 0; i < this.numPlayers; i++) {
					const card = this.players[i].revealedCards.pop();
					if (spyChoices[i] === "deck") {
						this.players[i].deck.push(card);
					} else {
						this.players[i].discard.push(card);
					}
				}
			}
		);
		return {
			actions: 1
		};
	}

	/**
	 * Each other player reveals the top 2 cards of his deck.
	 * If they revealed any Treasure cards, they trash one of them that you choose.
	 * You may gain any or all of these trashed cards.
	 * They discard the other revealed cards.
	 * @param {number} playerIndex
	 */
	thiefCardEffect(playerIndex) {
		for(let i = 0; i < this.numPlayers; i++) {
			if(i != playerIndex) {
				// reveal top 2 cards from OTHER players
				this.drawCard(i, true);
				this.drawCard(i, true);
			}
		}
		this.changePhaseUsingActionCard("thief", {},
			/**
			 * After playing the thief card (in the thief phase) can set the thief choice
			 * For each player specify which treasure cards (if any) to trash
			 * For the trashed cards, specify if they should be trashed or gained
			 * @param {any} choices Map from player index to {index: <number>, action: "trash" | "gain"}
			 */
			(choices) => {
				for(let i = 0; i < this.numPlayers; i++) {
					if(choices[i]) {
						let j = choices[i].index;
						if(j > this.players[i].revealedCards.length) {
							throw new Error(`${j} is not a valid index into revealed cards by player ${this.players[i].name}`);
						}
						let card = this.players[i].revealedCards[j];
						if(card.type !== "treasure") {
							throw new Error("selected card must be a treasure card");
						}
						// remove from revealed cards
						this.players[i].revealedCards.splice(j, 1);
						if(choices[i].action === "trash") {
							// trash that card
							this.trash.push(card);
						} else {
							// gain that card
							this.gainCard(card.name, playerIndex);
						}
					}
					// discard all revealed cards that haven't been trashed/gained
					while(this.players[i].revealedCards.length > 0) {
						let card = this.players[i].revealedCards.pop();
						this.players[i].discard.push(card);
					}
				}
			}
		);
		return {};
	}

	/**
	 * +2 cards
	 * +1 action
	 * @param {number} playerIndex
	 */
	laboratoryCardEffect(playerIndex) {
		this.drawCards(playerIndex, 2);
		return {
			actions: 1,
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
		this.drawCards(playerIndex, 1);
		return {
			actions: 2,
		};
	}

	/**
	 * +1 buy, +2 gold
	 */
	woodcutterCardEffect() {
		return {
			buys: 1,
			gold: 2
		};
	}

	/**
	 * Trash a card from your hand.
	 * Gain a card costing up to $2 more than the trashed card.
	 */
	remodelCardEffect() {
		this.changePhaseUsingActionCard("trash", {
			numTrash: 1,
			trashType: "any",
		}, () => {
			// TODO this will give incorrect results if player does not trash a card
			const trashedCard = this.trash[this.trash.length - 1];
			this.changePhaseUsingActionCard("gain", {
				maxGainCost: trashedCard.cost + 2,
				gainType: "any"
			});

		});
		return {
			gainBonusCost: 2,
			gainType: "any"
		};
	}

	/**
	 * +1 card, +1 action, +1 buy, +1 gold
	 * @param {number} playerIndex
	 */
	marketCardEffect(playerIndex) {
		this.drawCards(playerIndex, 1);
		return {
			actions: 1,
			buys: 1,
			gold: 1
		};
	}

	/**
	 * Trash a Copper from your hand. If you do, +$3.
	 * @param {number} playerIndex
	 */
	moneylenderCardEffect() {
		const trashCount = this.trash.length;
		this.changePhaseUsingActionCard("trash", {
			trashName: "copper",
			numTrash: 1,
			trashType: "treasure"
		}, () => {
			if(this.trash.length > trashCount) {
				// copper was trashed
				this.treasurePot += 3;
			}
		});
		return {};
	}

	/**
	 * Draw until you have 7 cards in hand.
	 * You may set aside any Action cards drawn this way, as you draw them;
	 * discard the set aside cards after you finish drawing.
	 * @param {number} playerIndex
	 */
	libraryCardEffect(playerIndex) {
		const numCardsInHand = this.players[playerIndex].hand.length;
		this.drawCards(playerIndex, 7 - numCardsInHand);
		this.changePhaseUsingActionCard("discard", {
			discardRange: {
				start: numCardsInHand,
				end: 7
			},
			discardType: "action",
			numDiscard: 999
		});
		return {};
	}

	/**
	 * NOTE: this card is not in the standard set
	 * +1 card, +1 action, +1 gold if you play a silver this turn
	 */
	merchantCardEffect(playerIndex) {
		this.drawCards(playerIndex, 1);
		return {
			actions: 1,
			firstPlayBonus: {
				"silver": {
					gold: 1
				}
			}
		};
	}

	/**
	 * +4 Cards; +1 Buy
	 * Each other player draws a card.
	 */
	councilRoomCardEffect(playerIndex) {
		for(let i = 0; i < this.numPlayers; i++) {
			if(i != playerIndex) {
				this.drawCard(i);
			}
		}
		this.drawCards(playerIndex, 4);
		return {
			buys: 1
		};
	}

	/**
	 * trash 4 cards
	 */
	chapelCardEffect() {
		this.changePhaseUsingActionCard("trash", {
			numTrash: 4,
			trashType: "any"
		});
		return {};
	}

	/**
	 * +2 Cards
	 * Each other player gains a Curse card.
	 */
	witchCardEffect(playerIndex) {
		for (let i = 0; i < 2; i++) {
			this.drawCard(playerIndex);
		}
		for(let i = 0; i < this.numPlayers; i++) {
			if(i != playerIndex) {
				this.gainCard("curse", i);
			}
		}
		return {};
	}

	/**
	 * Gain a card costing up to $4.
	 */
	workshopCardEffect() {
		this.changePhaseUsingActionCard("gain", {
			maxGainCost: 4,
			gainType: "any"
		}, null);
		return {};
	}

	/**
	 * Trash a Treasure card from your hand.
	 * Gain a Treasure card costing up to $3 more; put it into your hand.
	 */
	mineCardEffect() {
		this.changePhaseUsingActionCard("trash", {
			numTrash: 1,
			trashType: "treasure"
		}, () => {
			// TODO this will give incorrect results if player does not trash a card
			const trashedCard = this.trash[this.trash.length - 1];
			this.changePhaseUsingActionCard("gain", {
				maxGainCost: trashedCard.cost + 3,
				gainType: "treasure"
			});
		});
		return {
			gainBonusCost: 3,
			gainType: "treasure"
		};
	}

	/**
	 * Trash this card. Gain a card costing up to $5.
	 * @param {number} playerIndex
	 */
	feastCardEffect() {
		this.changePhaseUsingActionCard("gain", {
			maxGainCost: 5,
			gainType: "any"
		});
		return {
			sendToTrash: true
		};
	}

	/**
	 * +1 Action
	 * Discard any number of cards.
	 * +1 Card per card discarded.
	 * @param {number} playerIndex
	 */
	cellarCardEffect(playerIndex) {
		const discardPileSizeStart = this.players[playerIndex].discard.length;
		this.changePhaseUsingActionCard("discard", {
			// means functionally unlimited
			numDiscard: 999,
			discardType: "any"
		}, () => {
			const discardPileSizeEnd = this.players[playerIndex].discard.length;
			const numDiscarded = discardPileSizeEnd - discardPileSizeStart;
			for (let i = 0; i < numDiscarded; i++) {
				this.drawCard(playerIndex);
			}
		});
		return {};
	}

	/**
	 * Worth 1 Victory for every 10 cards in your deck (rounded down).
	 * @param {number} playerIndex
	 * @returns {number} number of points to add
	 */
	gardensCardEffect(playerIndex) {
		const player = this.players[playerIndex];
		const numCards = player.hand.length + player.discard.length + player.deck.length;
		return Math.floor(numCards / 10);
	}

	militiaCardEffect() {
		throw new Error("not implemented");
	// for(let i = 0; i < this.numPlayers; i++) {
	// 	if(i != playerIndex) {
	// 		this.discardCards()
	// 	}
	// }
	}

	/**
	 * +$2
	 * You may immediately put your deck into your discard pile.
	 */
	chancellorCardEffect() {
		this.changePhaseUsingActionCard("discard-deck", {}, () => {
		});
		return {
			gold: 2
		};
	}

	/**
	 * Reveal cards from your deck until you reveal 2 Treasure cards.
	 * Put those Treasure cards in your hand and discard the other revealed cards.
	 */
	adventurerCardEffect(playerIndex) {
		let numTreasures = 0;
		while(numTreasures < 2) {
			let card = this.drawCard(playerIndex, true);
			if(card.type === "treasure") {
				numTreasures++;
			}
		}
		this.changePhaseUsingActionCard("adventurer", {}, () => {
			const player = this.players[playerIndex];
			while(player.revealedCards.length > 0) {
				let card = player.revealedCards.pop();
				if(card.type === "treasure") {
					player.hand.push(card);
				} else {
					player.discard.push(card);
				}
			}
		});
		return {};
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

		// victory cards
		cards.estate = {
			name: "estate",
			cost: 2,
			type: "victory",
			points: 1,
		};
		cards.duchy = {
			name: "duchy",
			cost: 5,
			type: "victory",
			points: 3,
		};
		cards.province = {
			name: "province",
			cost: 8,
			type: "victory",
			points: 6,
		};
		cards.curse = {
			name: "curse",
			cost: 0,
			type: "victory",
			points: -1,
		};

		const gardensEffect = this.gardensCardEffect.bind(this);
		cards.gardens = {
			name: "gardens",
			cost: 4,
			type: "victory",
			points: 0,
			pointsEffect: gardensEffect
		};

		// action cards
		const smithy = this.smithyCardEffect.bind(this);
		cards.smithy = {
			name: "smithy",
			cost: 4,
			type: "action",
			effect: smithy,
		};

		const spy = this.spyCardEffect.bind(this);
		cards.spy = {
			name: "spy",
			cost: 4,
			type: "action",
			effect: spy
		};

		const thief = this.thiefCardEffect.bind(this);
		cards.thief = {
			name: "thief",
			cost: 4,
			type: "action",
			effect: thief
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

		const moneylenderEffect = this.moneylenderCardEffect.bind(this);
		cards.moneylender = {
			name: "moneylender",
			cost: 4,
			type: "action",
			effect: moneylenderEffect
		};

		const chapelEffect = this.chapelCardEffect.bind(this);
		cards.chapel = {
			name: "chapel",
			cost: 2,
			type: "action",
			effect: chapelEffect,
		};

		const witchEffect = this.witchCardEffect.bind(this);
		cards.witch = {
			name: "witch",
			cost: 5,
			type: "action",
			effect: witchEffect
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

		const mineEffect = this.mineCardEffect.bind(this);
		cards.mine = {
			name: "mine",
			cost: 5,
			type: "action",
			effect: mineEffect
		};


		const cellarEffect = this.cellarCardEffect.bind(this);
		cards.cellar = {
			name: "cellar",
			cost: 2,
			type: "action",
			effect: cellarEffect
		};

		const feastEffect = this.feastCardEffect.bind(this);
		cards.feast = {
			name: "feast",
			cost: 4,
			type: "action",
			effect: feastEffect
		};

		const chancellorEffect = this.chancellorCardEffect.bind(this);
		cards.chancellor = {
			name: "chancellor",
			cost: 3,
			type: "action",
			effect: chancellorEffect
		};

		const libraryEffect = this.libraryCardEffect.bind(this);
		cards.library = {
			name: "library",
			cost: 5,
			type: "action",
			effect: libraryEffect
		};

		// TODO unfinished cards
		cards.moat = {
			name: "moat",
			cost: 2,
			type: "action",
			reaction: true,
			effect: () => {}
		};

		const militiaEffect = this.militiaCardEffect.bind(this);
		cards.militia = {
			name: "militia",
			cost: 4,
			type: "action",
			attack: true,
			effect: militiaEffect
		};

		const merchantEffect = this.merchantCardEffect.bind(this);
		cards.merchant = {
			name: "merchant",
			cost: 3,
			type: "action",
			effect: merchantEffect
		};

		const councilRoomEffect = this.councilRoomCardEffect.bind(this);
		cards["council room"] = {
			name: "council room",
			cost: 5,
			type: "action",
			effect: councilRoomEffect
		};

		const adventurerEffect = this.adventurerCardEffect.bind(this);
		cards.adventurer = {
			name: "adventurer",
			cost: 6,
			type: "action",
			effect: adventurerEffect
		};

		return cards;
	}

	/**
	 * Initialize mapping of card names to their quantity
	 * @param {number} numPlayers
	 * @param {string[] | null} kingdomCardPiles
	 * @returns {object} mapping of card names to their quantity
	 */
	initSupply(numPlayers, kingdomCardPiles) {
		const supply = {};
		kingdomCardPiles = kingdomCardPiles || [];

		// treasure cards
		supply.copper = 60 + numPlayers * 7;
		supply.silver = 40;
		supply.gold = 30;

		// victory cards
		// they have different numbers depending on # of players
		let numVictoryCards;
		if (numPlayers === 2) {
			numVictoryCards = 8;
		} else {
			numVictoryCards = 12;
		}

		// per the rules, starting cards do not come from supply
		supply.estate = numVictoryCards + numPlayers * 3;
		supply.duchy = numVictoryCards;
		supply.province = numVictoryCards;
		supply.curse = (numPlayers - 1) * 10;

		if(kingdomCardPiles.length > 10) {
			throw new Error("Cannot have more than 10 kingdom card piles");
		}

		// commented-out cards are not implemented
		const baseKingdomCards = [
			"adventurer",
			"cellar",
			"chancellor",
			"chapel",
			"council room",
			"feast",
			"festival",
			"gardens",
			"laboratory",
			"market",
			"mine",

			"library",
			// "militia",
			"moneylender",
			"remodel",
			"smithy",
			"spy",
			"thief",
			"village",
			"witch",
			"woodcutter",
			"workshop",
			// throne room: not implemented
		];
		const implementedKingdomCards = baseKingdomCards.concat([
			// not part of basic set but implemented:
			"merchant"
		]);

		for(let cardName of kingdomCardPiles) {
			let i = implementedKingdomCards.indexOf(cardName);
			// find the card
			if(i === -1) {
				throw new Error(`Could not find card ${cardName} in card names, possibly not implemented`);
			}
			// remove from array
			implementedKingdomCards.splice(i, 1);
			let j = baseKingdomCards.indexOf(cardName);
			if(j >= 0) {
				baseKingdomCards.splice(j, 1);
			}
		}

		// draw only from base cards
		const p2 = _.sampleSize(baseKingdomCards, 10 - kingdomCardPiles.length);
		const piles = kingdomCardPiles.concat(p2);

		if(piles.length != 10) {
			throw new Error(`Piles must be exactly of size 10 in setup, found ${piles.length}`);
		}

		for(let cardName of piles) {
			const card = this.cards[cardName];
			if(!card) {
				throw new Error(`Failed to find card ${cardName}`);
			}
			if(card.type === "action") {
				supply[cardName] = 10;
			} else if(card.type === "victory") {
				supply[cardName] = numVictoryCards;
			} else {
				throw new Error();
			}
		}

		return supply;
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
				this.players[p].deck.push(card);
			}
			for (let j = 0; j < 7; j++) {
				let card = this.takeCard("copper", p);
				if(!card) {
					throw new Error("took null copper card");
				}
				this.players[p].deck.push(card);
			}

			// and shuffle
			this.players[p].deck = _.shuffle(this.players[p].deck);
		}
	}

	/**
	 * Remove card from supply.
	 * @param {string} cardName
	 * @param {number} playerIndex
	 * @returns {Card} card object on success
	 * @throws Error when pile empty
	 */
	takeCard(cardName, playerIndex) {
		if (this.supply[cardName] === 0) {
			throw new Error(`Cannot take ${cardName} from deck, pile empty`);
		}
		const player = this.players[playerIndex];

		this.supply[cardName]--;
		const card = this.cards[cardName];

		// points are added on here
		if (card.type === "victory") {
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
		this.drawCard(this.turn);
		const player = this.players[this.turn];
		// start out with 1 buy
		player.numBuys = 1;
		player.numActions = 1;
		this.treasurePot = 0;
		this.firstPlayBonus = {};
		this.phase = "action";
		return player.deck.length === 0 && player.discard.length === 0;
	}

	/**
	 * Change the game phase using an action card
	 * @param {string} phaseName
	 * @param {any} params
	 * @param {callable} callback
	 */
	changePhaseUsingActionCard(phaseName, params, callback) {
		this.canCleanupActionStack = false;
		this.phase = phaseName;
		if(params.maxGainCost) {
			this.maxGainCost = params.maxGainCost;
		}
		if(params.gainType) {
			this.gainType = params.gainType;
		}
		if(params.numTrash) {
			this.numTrash = params.numTrash;
		}
		if(params.trashType) {
			this.trashType = params.trashType;
		}
		if(params.trashName) {
			this.trashName = params.trashName;
		}
		if(params.numDiscard) {
			this.numDiscard = params.numDiscard;
		}
		if(params.discardType) {
			this.discardType = params.discardType;
		}
		if(params.discardRange) {
			this.discardRange = params.discardRange;
		}
		this.endPhaseCallback = callback;
	}

	/**
	 * End the current phase that was triggered by an action card
	 * Pass options to the callback for that action card
	 * @param {any} endPhaseOptions
	 */
	endActionCardPhase(endPhaseOptions) {
		this.canCleanupActionStack = true;
		if (this.endPhaseCallback) {
			this.endPhaseCallback(endPhaseOptions);
		}
		if(this.canCleanupActionStack) {
			this.endPhaseCallback = null;
			this.maxGainCost = 0;
			this.gainType = null;
			this.numTrash = 0;
			this.trashType = null;
			this.trashName = null;
			this.numDiscard = 0;
			this.discardType = null;
			this.discardRange = null;
			this.phase = "action";
		}
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
	 * @param {boolean} addToRevealed If true, instead of adding the card to hand, add to the revealed cards
	 * @returns {Card} Return the card that was drawn
	 */
	drawCard(playerIndex, addToRevealed) {
		const player = this.players[playerIndex];
		if (player.deck.length === 0) {
			// the player has run out of cards
			// set the player's cards as a shuffled version of their discard pile
			player.deck = _.shuffle(player.discard);
			player.discard = [];
		}

		if (player.deck.length === 0) {
			return false;
		}

		const card = player.deck.pop();
		if(!card) {
			throw new Error("Drew null card from the deck");
		}
		if(addToRevealed) {
			player.revealedCards.push(card);
		} else {
			player.hand.push(card);
		}

		console.debug(`Player ${player.name} drew ${card.name}`);

		return card;
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
	 * @param {String[] | null} supplyCards
	 */
	setup(players, supplyCards) {
		this.cards = this.initCards();
		this.supply = this.initSupply(this.numPlayers, supplyCards);
		this.initPlayers(players);
		this.dealHands();
	}

	/**
	 * Same as gainCard, but check the phase and other restrictions first
	 * @param {string} cardName
	 * @param {number} playerIndex
	 * @returns {Card}
	 */
	gainCardWithCheck(cardName, playerIndex) {
		if(this.phase !== "gain") {
			throw new Error(`Cannot gain cards outside of gain phase - phase is ${this.phase}`);
		}
		let gainCard = this.cards[cardName];
		if(gainCard.cost > this.maxGainCost) {
			throw new Error(`Action card allowed you to gain a card costing up to ${this.maxGainCost} but you tried to gain a card costing ${gainCard.cost}`);
		}
		if(this.gainType !== "any" && gainCard.type !== this.gainType) {
			throw new Error(`Action card allowed you to gain a card of type ${this.gainType} but you tried to gain a card of type ${gainCard.type}`);
		}
		return this.gainCard(cardName, playerIndex);
	}

	/**
	 * Remove a card from the supply and add it to the player's discard pile
	 * Only checks whether the supply has that card
	 * @param {string} cardName
	 * @param {number} playerIndex
	 * @returns {Card}
	 */
	gainCard(cardName, playerIndex) {
		const player = this.players[playerIndex];
		const card = this.takeCard(cardName, playerIndex);
		if (card === null) {
			throw new Error("Failed to take the card from the deck while buying/gaining");
		}
		player.discard.push(card);
		console.debug(`Player ${player.name} gained ${card.name}`);
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
			throw new Error(`cannot play treasure cards outside the buy phase (${this.phase} phase)`);
		}
		const player = this.players[this.turn];
		if(player.hand[cardIndex].type !== "treasure") {
			throw new Error(`Card type must be treasure, got ${player.hand[cardIndex].type}`);
		}
		const card = player.hand.splice(cardIndex, 1)[0];
		if(card.name in this.firstPlayBonus) {
			this.treasurePot += this.firstPlayBonus[card.name].gold || 0;
			delete this.firstPlayBonus[card.name];
		}
		this.treasurePot += card.value;
		console.debug(`Player ${player.name} played treasure ${card.name}. Treasure pot now ${this.treasurePot}`);
		player.discard.push(card);
	}

	/**
	 * For now, this only checks the province pile
	 * @returns {boolean}
	 */
	checkGameEnd() {
		return this.supply.province === 0;
	}

	/**
	 * Run the game to completion. If the game is over, return the winning players
	 */
	playGame() {
		while (!this.isGameOver) {
			this.doTurn();
		}
		return this.winArr;
	}

	calculateGameEnd() {
		// trigger all the effects for cards
		for (let playerIndex = 0; playerIndex < this.numPlayers; playerIndex++) {
			// reset points for this player
			let player = this.players[playerIndex];
			player.points = 0;

			let allCards = player.hand.concat(player.discard, player.deck);
			for(let card of allCards) {
				if(card.type === "victory" && card.points) {
					console.debug(`Added points to player ${player.name} due to ${card.name}`);
					player.points += card.points;
				}

				if(card.type === "victory" && card.pointsEffect) {
					let bonusPoints = card.pointsEffect(playerIndex);
					console.debug(`Added ${bonusPoints} points to player ${player.name} due to gardens card`);
					player.points += bonusPoints;
				}
			}
		}

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
	}

	/**
	 * Change the phase to cleanup, then to draw for the next player
	 * Perform the cleanup phase for the current player
	 * Change the turn to the next player
	 */
	endTurn() {
		if(this.phase !== "buy") {
			throw new Error(`cannot end turn in ${this.phase} phase`);
		}

		this.phase = "cleanup";

		const player = this.players[this.turn];

		player.numActions = 0;
		player.numBuys = 0;

		// cleanup phase: discard all cards in play area
		player.discard.push(...this.playArea);
		this.playArea = [];

		// cleanup phase: discard whole hand
		player.discard.push(...player.hand);
		player.hand = [];

		// draw 5 new cards
		this.drawCards(this.turn, 5);

		if (this.checkGameEnd()) {
			this.isGameOver = true;
			this.calculateGameEnd();
		} else {
			this.turn = (this.turn + 1) % this.numPlayers;
		}

		this.phase = "draw";
	}

	/**
	 * Put entire deck into discard stack
	 * @param {Player} player
	 */
	discardDeck(player) {
		if(this.phase !== "discard-deck") {
			throw new Error("cannot discard deck outside of discard-deck phase");
		}
		player.discard.push(...player.deck);
		player.deck = [];
	}

	/**
	 * Trash the given cards from that player. Verify phase unless explicitly told not to
	 *
	 * @param {Player} player
	 * @param {number[]} cardIndexes
	 * @param {boolean} noVerify - whether to run checks
	 * @returns {Card[]} trashed cards
	 */
	trashCards(player, cardIndexes, noVerify) {
		noVerify = noVerify || false;
		const runChecks = !noVerify;
		if(runChecks && this.phase !== "trash") {
			throw new Error("Cannot trash cards outside of trash phase");
		}
		if(runChecks && cardIndexes.length > this.numTrash) {
			throw new Error(`Can trash a max of ${this.numTrash} cards, tried to trash ${cardIndexes.length}`);
		}
		const trashed = [];
		// sort in reverse order to not mess up indexing
		cardIndexes.sort((a, b) => {
			return b - a;
		});
		for(let cardIndex of cardIndexes) {
			const card = player.hand.splice(cardIndex, 1)[0];
			if(runChecks && this.trashType !== "any" && card.type !== this.trashType) {
				throw new Error(`Can only trash cards of type ${this.trashType} but tried to trash card of type ${card.type}`);
			}
			if(runChecks && this.trashName && card.name !== this.trashName) {
				throw new Error(`Can only trash cards with name ${this.trashName}`);
			}
			console.debug(`Player ${player.name} trashed card ${card.name}`);
			this.trash.push(card);
			trashed.push(card);
		}
		return trashed;
	}

	/**
	 * Discard cards in discard phase. Check restrictions.
	 * @param {Player} player
	 * @param {number[]} cardIndexes
	 */
	discardCards(player, cardIndexes) {
		if(this.phase !== "discard") {
			throw new Error("Can only discard cards in discard phase");
		}
		if(cardIndexes.length > this.numDiscard) {
			throw new Error(`Tried to discard ${cardIndexes.length} but can only discard up to ${this.numDiscard}`);
		}
		// sort in reverse order to not mess up indexing
		cardIndexes.sort((a, b) => {
			return b - a;
		});

		// reverse order
		for(let cardIndex of cardIndexes) {
			if(this.discardRange && (cardIndex < this.discardRange.min || cardIndex >= this.discardRange.max)) {
				throw new Error(`discard range is [${this.discardRange.min}, ${this.discardRange.max}). Tried to discard at index ${cardIndex}`);
			}
			const card = player.hand[cardIndex];
			if(this.discardType != "any" && this.discardType != card.type) {
				throw new Error(`Card was of type ${card.type} but can only discard cards of type ${this.discardType}`);
			}
			player.discardCard(cardIndex);
		}
	}

	/**
	 * Draw multiple cards for the target player
	 * @param {number} playerIndex
	 * @param {number} numCards
	 */
	drawCards(playerIndex, numCards) {
		for(let i = 0; i < numCards; i++) {
			this.drawCard(playerIndex);
		}
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
			throw new Error(`cannot play action cards outside of action phase (${this.phase} phase)`);
		}
		if(!card) {
			throw new Error("card cannot be null");
		}

		// remove card from player's hand before triggering its effects
		const cardIndex = player.hand.indexOf(card);
		player.hand.splice(cardIndex, 1);
		this.playArea.push(card);

		if(card.name in this.firstPlayBonus) {
			this.treasurePot += this.firstPlayBonus[card.name].gold || 0;
			this.firstPlayBonus.pop(card.name);
		}

		const cardEffect = card.effect(playerIndex);
		if(!cardEffect) {
			console.log(card);
			console.error(`Failed to find effect for card ${card.name}`);
		}
		player.numActions += cardEffect.actions || 0;
		player.numBuys += cardEffect.buys || 0;
		let sendToTrash = cardEffect.sendToTrash || false;
		this.treasurePot += cardEffect.gold || 0;
		let firstPlayBonus = cardEffect.firstPlayBonus || {};
		for(let cardName in firstPlayBonus) {
			this.firstPlayBonus[cardName] = firstPlayBonus[cardName];
		}

		if(sendToTrash) {
			this.trash.push(card);
			let i = this.playArea.indexOf(card);
			this.playArea.splice(i, 1);
		}

		player.numActions--;

		console.debug(`Player ${player.name} played ${card.name}`);

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
		if(this.supply[cardName] === 0) {
			return false;
		}
		let gainCard = this.cards[cardName];
		if(gainCard.cost > maxGainCost) {
			// throw new Error(`Card allowed you to gain a card costing up to ${maxGainCost} but you tried to gain a card costing ${gainCard.cost}`);
			return false;
		}
	}
	*/

	/**
	 * Run player strategy automatically
	 */
	doTurn() {
		if (this.isGameOver) {
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
			console.debug(`******** starting round ${this.round} *************`);
		}

		// draw a card and automatically transition to next phase
		this.drawPhase();

		const player = this.players[p];

		while (player.numActions > 0) {
			const card = player.strategy.actionTurn(player);
			if (card) {
				console.debug(`Player ${player.name} played action card ${card.name} on round ${this.round}`);
				const effect = this.playActionCard(player, p, card);
				while(this.phase !== "action") {
					if (this.phase === "gain") {
						const gainCardName = player.strategy.gainCard(player, this.maxGainCost);
						if (gainCardName) {
							this.gainCardWithCheck(gainCardName, p);
							console.debug(`Player ${player.name} gained card ${gainCardName}`);
						}
					} else if (this.phase === "trash") {
						const trashCardIndexes = player.strategy.trashCardForGain(
							player,
							effect.gainBonusCost,
							this.trashType,
							effect.gainType
						);
						this.trashCards(player, trashCardIndexes);
					} else {
						throw new Error(`phase ${this.phase} not implemented`);
					}
					this.endActionCardPhase();
				}
			} else {
				// no action
				break;
			}
		}
		this.endActionPhase();

		if(this.phase !== "buy") {
			throw new Error(`should be buy phase after action phase, got ${this.phase} phase`);
		}

		// buy phase
		while (player.numBuys > 0) {
			let treasureCards = player.strategy.playTreasures(player, this.supply, this.treasurePot);
			// sort in reverse order, in place
			// reverse order to keep indexes valid
			treasureCards.sort((a, b) => {
				return b - a;
			});
			for(let cardIndex of treasureCards) {
				this.playTreasureCard(cardIndex);
			}

			let cardName = player.strategy.buyTurn(player, this.supply, this.treasurePot);
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