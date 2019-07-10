const Game = require("../src/game");
const { PlayerStrategy } = require("../src/player-strategies");
const Player = require("../src/player");


const playAllTreasureCards = (game, player) => {
	// TODO
	for(let i = player.hand.length - 1; i >= 0; i--) {
		let card = player.hand[i];
		if(card.type === "treasure") {
			game.playTreasureCard(i);
		}
	}
};

class SimpleTestStrategy extends PlayerStrategy {
	actionTurn() {
		return null;
	}

	getBuyGoal(player, deck, treasurePot) {
		const money = player.getMoneyInHand() + treasurePot;
		// console.log(`${player.name} -> ${money} (${treasurePot})`);
		if (money >= 8 && deck.province > 0) {
			return "province";
		} else if(money >= 6 && deck.gold > 0) {
			return "gold";
		} else if (money >= 3 && deck.silver > 0) {
			return "silver";
		}
		return null;
	}
}

describe("game", () => {

	test("can finish a game by resource exhaustion manually", () => {
		const game = new Game({
			numPlayers: 2
		});

		// set the AI

		while(!game.gameOver) {
			let player = game.players[game.turn];

			// we have a very stupid AI
			game.drawPhase();
			game.endActionPhase();

			const money = player.getMoneyInHand();
			if (money >= 8 && game.deck.province > 0) {
				playAllTreasureCards(game, player);
				game.buyCard("province", game.turn);
			} else if(money >= 6 && game.deck.gold > 0) {
				playAllTreasureCards(game, player);
				game.buyCard("gold", game.turn);
			} else if (money >= 3 && game.deck.silver > 0) {
				playAllTreasureCards(game, player);
				game.buyCard("silver", game.turn);
			}
			game.endTurn();
		}
		// just want the game to run to completion
		expect(1).toBe(1);
	});

	test("can finish a game by resource exhaustion using AI", () => {
		const players = [
			new Player(
				"test 1",
				new SimpleTestStrategy()
			),
			new Player(
				"test 2",
				new SimpleTestStrategy()
			)
		];
		const game = new Game({
			numPlayers: 2,
			players: players
		});
		while(!game.gameOver) {
			game.doTurn();
		}
		// just want the game to run to completion
		expect(1).toBe(1);
	});
});