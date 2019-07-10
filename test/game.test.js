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

	test("make sure Cellar works", () => {
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human"
		});

		const player = game.players[0];
		expect(player.hand.length).toBe(5);

		game.drawPhase();

		// add cellar card
		const card = game.cards.cellar;
		player.hand.push(card);

		expect(player.hand.length).toBe(7);

		// play cellar card
		const cardEffect = game.playActionCard(player, 0, card);
		expect(cardEffect.trash).toBe(4);

		// trash 4 cards
		game.trashCards(player, [0, 1, 2, 3]);

		// now should have 2 cards (-4 cards, -1 cellar card)
		expect(player.hand.length).toBe(2);
		expect(game.trash.length).toBe(4);
		expect(player.discard.length).toBe(1);
	});

	test("try the strategy of multiple buys per turn", () => {
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human"
		});

		// 5 cards
		const player = game.players[0];

		// +3 cards
		const labCard = game.cards.laboratory;
		player.hand.push(labCard);
		const villageCard = game.cards.village;
		player.hand.push(villageCard);
		const marketCard = game.cards.market;
		player.hand.push(marketCard);

		// +1 card
		game.drawPhase();

		expect(player.hand.length).toBe(9);

		expect(player.numActions).toBe(1);
		expect(player.numBuys).toBe(1);

		// +2 cards, +1 action
		game.playActionCard(player, 0, labCard);
		// +1 card, +2 actions
		game.playActionCard(player, 0, villageCard);
		// +1 card, +1 action, +1 buy, +1 gold
		game.playActionCard(player, 0, marketCard);

		expect(player.numBuys).toBe(2);
		expect(player.numActions).toBe(2);
		expect(game.treasurePot).toBe(1);
		expect(player.hand.length).toBe(10);
	});
});