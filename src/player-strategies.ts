import {ICard, IVictoryCard, ITreasureCard} from "./card";
import Player, {IPlayerStrategy} from "./player";
import { TSupplyMap, TStringCardMap } from "./types";


export class PlayerStrategy implements IPlayerStrategy {
	buyGoalCard: string | null;

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
	trashCards(player: Player, numCards: number): number[] {
		const trash = [];

		for(let i = 0; i < player.hand.length; i++) {
			if(player.hand[i].type === "victory" && (player.hand[i] as IVictoryCard).points < 0 && trash.length < numCards) {
				trash.push(i);
			}
			if(player.hand[i].name === "copper" && trash.length < numCards) {
				trash.push(i);
			}
		}

		return trash;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	trashCardForGain(player: Player, gainBonusCost: number, trashType: string | null, gainType: string): number[] {
		throw new Error("implement in subclass");
	}

	/**
	 * A basic implementation of gaining cards
	 * @param {Player} player
	 * @param {number} maxGainCost
	 * @returns {string | null}
	 */
	gainCard(player: Player, maxGainCost: number): string | null {
		if (maxGainCost >= 3) {
			return "silver";
		}
		return null;
	}

	/**
	 * @returns {Card | null}
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	actionTurn(player: Player): ICard | null {
		throw new Error("must subclass");
	}

	/**
	 * @param {Player} player
	 * @param {TSupplyMap} supply
	 * @param {TStringCardMap} cards
	 * @param {number} treasurePot
	 * @returns {number[]} array of card indexes
	 */
	playTreasures(player: Player, supply: TSupplyMap, cards: TStringCardMap, treasurePot: number): number[] {
		this.buyGoalCard = this.getBuyGoal(player, supply, treasurePot);

		if(!supply) {
			throw new Error("supply not set");
		}

		const treasures = [];

		if (this.buyGoalCard) {
			console.debug(`AI player ${player.name} trying to buy ${this.buyGoalCard}`);
			const buyGoalCost = cards[this.buyGoalCard].cost;
			let total = 0;
			for(let i = 0; i < player.hand.length; i++) {
				const card = player.hand[i];
				if (card.type === "treasure") {
					total += (card as ITreasureCard).value;
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
	 * @returns {string | null}
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	buyTurn(player: Player, supply: TSupplyMap, treasurePot: number): string | null {
		return this.buyGoalCard;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	getBuyGoal(player: Player, supply: TSupplyMap, treasurePot: number): string | null {
		throw new Error("must subclass");
	}
}


export class BigMoneyStrategy extends PlayerStrategy {

	/**
	 * @returns {Card | null}
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	actionTurn(player: Player): ICard | null {
		return null;
	}

	/**
	 * @param {Player} player
	 * @returns {string | null}
	 */
	getBuyGoal(player: Player, supply: any, treasurePot: number): string | null {
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
export class SmartBigMoneyStrategy extends PlayerStrategy {

	/**
	 * @returns {Card | null}
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	actionTurn(player: Player): ICard | null {
		return null;
	}

	/**
	 * @param {Player} player
	 * @param {any} supply Map from card name to number of cards of that type left
	 * @param {number} treasurePot
	 * @returns {string | null}
	 */
	getBuyGoal(player: Player, supply: any, treasurePot: number): string | null {
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
export class SmartDuchyStrategy extends PlayerStrategy {

	/**
	 * @param {Player} player
	 * @returns {Card | null}
	 */
	actionTurn(player: Player): ICard | null {
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
	 * @param {any} supply Map from card name to number of cards of that type left
	 * @returns {string | null}
	 */
	getBuyGoal(player: Player, supply: any, treasurePot: number): string | null {
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

export class SmartSmithyStrategy extends PlayerStrategy {
	avgValue: number;
	numCards: number;
	provinceCutoff: number;

	constructor() {
		super();

		this.avgValue = 0.7;
		this.numCards = 10;
		this.provinceCutoff = 4;
	}

	addValue(v: number): void {
		this.avgValue = (this.numCards * this.avgValue + v) / (this.numCards + 1);
		this.numCards++;
	}

	/**
	 * @param {Player} player
	 * @returns {Card | null}
	 */
	actionTurn(player: Player): ICard | null {
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
	 * @param {any} supply Map from card name to number of cards of that type left
	 * @returns {string | null}
	 */
	getBuyGoal(player: Player, supply: any, treasurePot: number): string | null {
		const money = player.getMoneyInHand() + treasurePot;
		const card = this.buyTurnWrapper(money, player, supply);
		return card;
	}

	/**
	 * @param {number} money
	 * @param {Player} player
	 * @param {any} supply Map from card name to number of cards of that type left
	 */
	buyTurnWrapper(money: number, player: Player, supply: any): any {
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

export class BigMoneySmithyStrategy extends PlayerStrategy {
	numSmithy: number;

	constructor() {
		super();

		this.numSmithy = 0;
	}

	/**
	 * @param {Player} player
	 * @returns {Card | null}
	 */
	actionTurn(player: Player): ICard | null {
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
	getBuyGoal(player: Player, supply: any, treasurePot: number): string | null {
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

export class PointsOnlyStrategy extends PlayerStrategy {
	/**
	 * @returns {Card | null}
	 */
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	actionTurn(player: Player): ICard | null {
		return null;
	}

	/**
	 * @param {Player} player
	 * @returns {string | null}
	 */
	getBuyGoal(player: Player, supply: any, treasurePot: number): string | null {
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
