// debugging
console.debug = function() {};

class Player {
	/**
	 * @param {String} name
	 * @param {PlayerStrategy} strategy
	 * @param {boolean} isHuman
	 */
	constructor(name, strategy, isHuman) {
		this.name = name;
		this.strategy = strategy;

		/**
		 * Array of Card objects
		 * The player's draw pile
		 */
		this.deck = [];

		/**
		 * Array of Card objects
		 * The player's current hand
		 */
		this.hand = [];

		/**
		 * Array of Card objects
		 * The player's discard pile
		 */
		this.discard = [];

		/**
		 * The cards that are currently revealed.
		 * Typically this is temporary
		 */
		this.revealedCards = [];

		/**
		 * These may not always be totally accurate
		 */
		this.points = 0;
		this.isHuman = isHuman || false;

		/* reset each turn */
		this.numBuys = 0;
		this.numActions = 0;
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

	/**
	 * @param {number} cardIndex
	 */
	discardCard(cardIndex) {
		const cards = this.hand.splice(cardIndex, 1);
		console.debug(`Discarding card ${cards[0].name} from player ${this.name}`);
		this.discard.push(cards[0]);
	}
}

module.exports = Player;