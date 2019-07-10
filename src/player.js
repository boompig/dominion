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
}

module.exports = Player;