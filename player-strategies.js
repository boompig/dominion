/* exported BigMoneyStrategy, SmartBigMoneyStrategy, SmartDuchyStrategy, SmartSmithyStrategy, BigMoneySmithyStrategy, PointsOnlyStrategy */

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
	buyTurn(player, deck, bonusMoney) {
		const money = player.getMoneyInHand() + bonusMoney;

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

/**
 * Same as big money, but buy duchies near the end
 */
class SmartBigMoneyStrategy extends PlayerStrategy {

	actionTurn() {
		return null;
	}

	/**
	 * @param {Player} player
	 * @param {object} deck Map from card name to number of cards of that type left
	 * @returns {string | null}
	 */
	buyTurn(player, deck, bonusMoney) {
		const money = player.getMoneyInHand() + bonusMoney;

		// should make sure that these piles exist first, but whatevs...
		if (money >= 8) {
			return "province";
		} if (money >= 6) {
			if (deck.province >= 5) {
				return "gold";
			}
			return "duchy";
		} if (money >= 3) {
			return "silver";
		}
		return null;
	}
}

/**
 * Always go for province when you have 8
 * Always go for duchy when you have 5
 * Always go for smithy when you have 4
 * Always go for silver when you have 3
 * Go for gold when you have 6, if there are 4 or more provinces left, otherwise buy a duchy
 */
class SmartDuchyStrategy extends PlayerStrategy {

	/**
	 * @param {Player} player
	 * @returns {string | null}
	 */
	actionTurn(player) {
		// if I have an action card, play it
		for (let i = 0; i < player.hand.length; i++) {
			if (player.hand[i].type === "action") {
				return player.hand[i];
			}
		}

		return null;
	}

	/**
	 * @param {Player} player
	 * @param {object} deck Map from card name to number of cards of that type left
	 * @returns {string | null}
	 */
	buyTurn(player, deck, bonusMoney) {
		const money = player.getMoneyInHand() + bonusMoney;

		if (money >= 8) {
			return "province";
		} if (money >= 6) {
			if (deck.province >= 4) {
				return "gold";
			}
			return "duchy";
		} if (money >= 5) {
			return "duchy";
		} if (money >= 4) {
			return "smithy";
		} if (money >= 3) {
			return "silver";
		}
		return null;
	}
}

class SmartSmithyStrategy extends PlayerStrategy {
	constructor() {
		super();

		this.avgValue = 0.7;
		this.numCards = 10;
		this.provinceCutoff = 4;
	}

	addValue(v) {
		this.avgValue = (this.numCards * this.avgValue + v) / (this.numCards + 1);
		this.numCards++;
	}

	/**
	 * @param {Player} player
	 * @returns {string | null}
	 */
	actionTurn(player) {
		// if I have an action card, play it
		for (let i = 0; i < player.hand.length; i++) {
			if (player.hand[i].type === "action") {
				return player.hand[i];
			}
		}

		return null;
	}

	/**
	 * @param {Player} player
	 * @param {object} deck Map from card name to number of cards of that type left
	 * @returns {string | null}
	 */
	buyTurn(player, deck, bonusMoney) {
		const money = player.getMoneyInHand() + bonusMoney;
		const card = this.buyTurnWrapper(money, player, deck);
		return card;
	}

	/**
	 * @param {number} money
	 * @param {Player} player
	 * @param {object} deck Map from card name to number of cards of that type left
	 */
	buyTurnWrapper(money, player, deck) {
		// calculate the avg value of coins in my deck
		// if the avg value is > (let's say 2)
		//
		const valueDrawThree = this.avgValue * 3;
		// var valueWithGold = (this.avgValue * this.numCards + 3) / (this.numCards + 1);
		// var valueWithSilver = (this.avgValue * this.numCards + 2) / (this.numCards + 1);

		if (money >= 8) {
			this.addValue(0);
			return "province";
		} if (money >= 6 && valueDrawThree <= 3) {
			if (deck.province >= this.provinceCutoff) {
				this.addValue(3);
				return "gold";
			}
			this.addValue(0);
			return "duchy";
		} if (money >= 4 && valueDrawThree <= 2) {
			this.addValue(2);
			return "silver";
		} if (money >= 4) {
			this.addValue(0);
			return "smithy";
		} if (money >= 3) {
			this.addValue(2);
			return "silver";
		}
		return null;
	}
}

class BigMoneySmithyStrategy extends PlayerStrategy {
	constructor() {
		super();

		this.numSmithy = 0;
	}

	/**
	 * @param {Player} player
	 * @returns {string | null}
	 */
	actionTurn(player) {
		// if I have an action card, play it
		for (let i = 0; i < player.hand.length; i++) {
			if (player.hand[i].type === "action") {
				return player.hand[i];
			}
		}

		return null;
	}

	/**
	 * @param {Player} player
	 * @returns {string | null}
	 */
	buyTurn(player, deck, bonusMoney) {
		const money = player.getMoneyInHand() + bonusMoney;
		// should make sure that these piles exist first, but whatevs...
		if (money >= 8) {
			return "province";
		} if (money >= 6) {
			return "gold";
		} if (money >= 4 && this.numSmithy < 3) {
			this.numSmithy++;

			return "smithy";
		} if (money >= 3) {
			return "silver";
		}
		return null;
	}
}

class PointsOnlyStrategy extends PlayerStrategy {
	actionTurn() {
		return null;
	}

	/**
	 * @param {Player} player
	 * @returns {string | null}
	 */
	buyTurn(player, deck, bonusMoney) {
		const money = player.getMoneyInHand() + bonusMoney;

		if (money >= 8) {
			return "province";
		} if (money >= 5) {
			return "duchy";
		} if (money >= 2) {
			return "estate";
		}
		return null;
	}
}

if(typeof(module) !== "undefined") {
	// eslint-disable-next-line
	module.exports = {
		BigMoneyStrategy,
		SmartBigMoneyStrategy,
		SmartDuchyStrategy,
		SmartSmithyStrategy,
		BigMoneySmithyStrategy,
		PointsOnlyStrategy
	};
}
