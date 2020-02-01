import { Game } from "../src/game";
import Player from "../src/player";
import { SimpleTestStrategy } from "./test-strategies";

const playAllTreasureCards = (game, player) => {
	// TODO
	for(let i = player.hand.length - 1; i >= 0; i--) {
		const card = player.hand[i];
		if(card.type === "treasure") {
			game.playTreasureCard(i);
		}
	}
};


describe("game", () => {
	test("setup is correct", () => {
		const game = new Game({
			numPlayers: 2
		});

		for(let i = 0; i < 2; i++) {
			const player = game.players[i];
			const allCards = player.deck.concat(player.hand);
			expect(allCards.length).toBe(10);
		}

		// 4 victory piles incl curses, 3 treasure piles, 10 kingdom piles
		expect(Object.keys(game.supply).length).toBe(17);
	});

	test("can finish a game by resource exhaustion manually", () => {
		const game = new Game({
			numPlayers: 2
		});

		// set the AI

		while(!game.isGameOver) {
			const player = game.players[game.turn];

			// we have a very stupid AI
			game.drawPhase();
			game.endActionPhase();

			const money = player.getMoneyInHand();
			if (money >= 8 && game.supply.province > 0) {
				playAllTreasureCards(game, player);
				game.buyCard("province", game.turn);
			} else if(money >= 6 && game.supply.gold > 0) {
				playAllTreasureCards(game, player);
				game.buyCard("gold", game.turn);
			} else if (money >= 3 && game.supply.silver > 0) {
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
		while(!game.isGameOver) {
			game.doTurn();
		}
		// just want the game to run to completion
		expect(1).toBe(1);
	});

});