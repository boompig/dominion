import {ICard, ITreasureCard} from "./card";

// debugging
console.debug = function() {};


interface IPlayerStrategy {};


export default class Player {
	name: string;
	strategy: IPlayerStrategy;
	deck: ICard[];
	hand: ICard[];
	discard: ICard[];
	revealedCards: ICard[];
	points: number;
	isHuman: boolean;
	numBuys: number;
	numActions: number;

	/**
	 * @param {string} name
	 * @param {PlayerStrategy} strategy
	 * @param {boolean} isHuman
	 */
	constructor(name: string, strategy: IPlayerStrategy, isHuman: boolean) {
		this.name = name;
		this.strategy = strategy;

		/**
		 * Array of Card objects
		 * The player's draw pile
		 * @type {Card[]}
		 */
		this.deck = [];

		/**
		 * Array of Card objects
		 * The player's current hand
		 * @type {Card[]}
		 */
		this.hand = [];

		/**
		 * Array of Card objects
		 * The player's discard pile
		 * @type {Card[]}
		 */
		this.discard = [];

		/**
		 * The cards that are currently revealed.
		 * Typically this is temporary
		 * @type {Card[]}
		 */
		this.revealedCards = [];

		/**
		 * These may not always be totally accurate
		 * @type {number}
		 */
		this.points = 0;
		/**
		 * @type {boolean}
		 */
		this.isHuman = isHuman || false;

		/**
		 * reset each turn
		 * @type {number}
		 */
		this.numBuys = 0;

		/**
		 * reset each turn
		 * @type {number}
		 */
		this.numActions = 0;
	}

	/**
	 * @returns {number}
	 */
	getMoneyInHand(): number {
		let money = 0;
		for (let i = 0; i < this.hand.length; i++) {
			if (this.hand[i].type === "treasure") {
				money += (this.hand[i] as ITreasureCard).value;
			}
		}
		return money;
	}

	/**
	 * @param {number} cardIndex
	 */
	discardCard(cardIndex: number) {
		const cards = this.hand.splice(cardIndex, 1);
		console.debug(`Discarding card ${cards[0].name} from player ${this.name}`);
		this.discard.push(cards[0]);
	}
}
