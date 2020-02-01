class PlayerStrategy {
	/**
	 * @param {string} name
	 */
	constructor() {
		/*
		 * card name
		 */
		this.buyGoalCard = null;
	}

	/**
	 * A basic implementation of trashing cards
	 *
	 * TODO for now, treat this as "up to"
	 *
	 * @param {Player}
	 * @param {number} numCards
	 * @returns {number[]} indices
	 */
	trashCards(player, numCards) {
		const trash = [];

		for(let i = 0; i < player.hand.length; i++) {
			if(player.hand[i].type === "treasure" && player.hand[i].points < 0 && trash.length < numCards) {
				trash.push(i);
			}
			if(player.hand[i].name === "copper" && trash.length < numCards) {
				trash.push(i);
			}
		}

		return trash;
	}

	/**
	 * A basic implementation of gaining cards
	 * @param {Player} player
	 * @param {number} maxGainCost
	 * @returns {string}
	 */
	gainCard(player, maxGainCost) {
		if (maxGainCost >= 3) {
			return "silver";
		}
		return null;
	}

	/**
	 * @returns {Card}
	 */
	actionTurn() {
		throw new Error("must subclass");
	}

	/**
	 * @param {Player} player
	 * @param {any} supply
	 * @param {number} treasurePot
	 * @returns {number[]} array of card indexes
	 */
	playTreasures(player, supply, treasurePot) {
		this.buyGoalCard = this.getBuyGoal(player, supply, treasurePot);

		if(!supply) {
			throw new Error("supply not set");
		}

		const treasures = [];

		if (this.buyGoalCard) {
			console.debug(`AI player ${player.name} trying to buy ${this.buyGoalCard}`);
			const buyGoalCost = supply[this.buyGoalCard].cost;
			let total = 0;
			for(let i = 0; i < player.hand.length; i++) {
				let card = player.hand[i];
				if (card.type === "treasure") {
					total += card.value;
					treasures.push(i);
				}
				if (total >= buyGoalCost) {
					break;
				}
			}
		}
		return treasures;
	}

	/**
	 * @returns {string}
	 */
	buyTurn() {
		return this.buyGoalCard;
	}

	getBuyGoal() {
		throw new Error("must subclass");
	}
}


class BigMoneyStrategy extends PlayerStrategy {

	/**
	 * @returns {Card}
	 */
	actionTurn() {
		return null;
	}

	/**
	 * @param {Player} player
	 * @returns {string}
	 */
	getBuyGoal(player, supply, treasurePot) {
		const money = player.getMoneyInHand() + treasurePot;

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

	/**
	 * @returns {Card}
	 */
	actionTurn() {
		return null;
	}

	/**
	 * @param {Player} player
	 * @param {any} supply map from card name to number of cards of that type left
	 * @param {number} treasurePot
	 * @returns {string | null}
	 */
	getBuyGoal(player, supply, treasurePot) {
		const money = player.getMoneyInHand() + treasurePot;

		// should make sure that these piles exist first, but whatevs...
		if (money >= 8) {
			return "province";
		} if (money >= 6) {
			if (supply.province >= 5) {
				return "gold";
			}
			if (supply.duchy > 0) {
				return "duchy";
			}
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
	 * @returns {Card | null}
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
	 * @param {any} supply map from card name to number of cards of that type left
	 * @returns {string | null}
	 */
	getBuyGoal(player, supply, treasurePot) {
		const money = player.getMoneyInHand() + treasurePot;

		if (money >= 8 && supply.province > 0) {
			return "province";
		} if (money >= 6) {
			if (supply.province >= 4) {
				return "gold";
			} else if (supply.duchy > 0) {
				return "duchy";
			}
		} if (money >= 5 && supply.duchy > 0) {
			return "duchy";
		} if (money >= 4 && supply.smithy > 0) {
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
	 * @returns {Card | null}
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
	 * @param {any} supply map from card name to number of cards of that type left
	 * @returns {string | null}
	 */
	getBuyGoal(player, supply, treasurePot) {
		const money = player.getMoneyInHand() + treasurePot;
		const card = this.buyTurnWrapper(money, player, supply);
		return card;
	}

	/**
	 * @param {number} money
	 * @param {Player} player
	 * @param {any} supply map from card name to number of cards of that type left
	 */
	buyTurnWrapper(money, player, supply) {
		// calculate the avg value of coins in my supply
		// if the avg value is > (let's say 2)
		//
		const valueDrawThree = this.avgValue * 3;
		// var valueWithGold = (this.avgValue * this.numCards + 3) / (this.numCards + 1);
		// var valueWithSilver = (this.avgValue * this.numCards + 2) / (this.numCards + 1);

		if (money >= 8) {
			this.addValue(0);
			return "province";
		} if (money >= 6 && valueDrawThree <= 3) {
			if (supply.province >= this.provinceCutoff) {
				this.addValue(3);
				return "gold";
			}
			this.addValue(0);
			if(supply.duchy > 0) {
				return "duchy";
			}
		} if (money >= 4 && valueDrawThree <= 2) {
			this.addValue(2);
			return "silver";
		} if (money >= 4) {
			this.addValue(0);
			if(supply.smithy > 0) {
				return "smithy";
			}
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
	 * @returns {Card | null}
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
	getBuyGoal(player, supply, treasurePot) {
		const money = player.getMoneyInHand() + treasurePot;
		// should make sure that these piles exist first, but whatevs...
		if (money >= 8 && supply.province > 0) {
			return "province";
		} if (money >= 6 && supply.gold > 0) {
			return "gold";
		} if (money >= 4 && this.numSmithy < 3 && supply.smithy > 0) {
			this.numSmithy++;
			return "smithy";
		} if (money >= 3 && supply.silver > 0) {
			return "silver";
		}
		return null;
	}
}

class PointsOnlyStrategy extends PlayerStrategy {
	/**
	 * @returns {Card}
	 */
	actionTurn() {
		return null;
	}

	/**
	 * @param {Player} player
	 * @returns {string | null}
	 */
	getBuyGoal(player, supply, treasurePot) {
		const money = player.getMoneyInHand() + treasurePot;

		if (money >= 8 && supply.province > 0) {
			return "province";
		} if (money >= 5 && supply.duchy > 0) {
			return "duchy";
		} if (money >= 2 && supply.estate > 0) {
			return "estate";
		}
		return null;
	}
}

module.exports = {
	PlayerStrategy,
	PointsOnlyStrategy,
	SmartBigMoneyStrategy,
	SmartDuchyStrategy,
	SmartSmithyStrategy,
	BigMoneyStrategy,
	BigMoneySmithyStrategy
};