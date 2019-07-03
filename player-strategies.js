/* exported PlayerStrategy, BigMoneyStrategy */

class PlayerStrategy {
	/**
	 * @param {String} name
	 */
	constructor(name) {
		this.name = name;
	}

	actionTurn() {
		throw new Error("must subclass");
	}

	/**
	 * @returns {String}
	 */
	buyTurn() {
		throw new Error("must subclass");
	}
}

class BigMoneyStrategy extends PlayerStrategy {

	actionTurn() {
		return null;
	}

	/**
	 * @param {Player} player
	 * @returns {String}
	 */
	buyTurn(index, player) {
		console.log(player);
		const money = player.getMoneyInHand();

		if (money >= 8) {
			return "province";
		} if (money >= 6) {
			return "gold";
		} if (money >= 3) {
			return "silver";
		}
		return null;
	}
}
