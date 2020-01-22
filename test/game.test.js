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

class DoNothingStrategy extends PlayerStrategy {
	actionTurn() {
		return null;
	}

	getBuyGoal() {
		return null;
	}
}

describe("game", () => {
	test("setup is correct", () => {
		const game = new Game({
			numPlayers: 2
		});

		for(let i = 0; i < 2; i++) {
			let player = game.players[i];
			let allCards = player.deck.concat(player.hand);
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
			let player = game.players[game.turn];

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

	test("test chapel - trash n numbers of cards", () => {
		const supply = ["chapel"];
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

		const player = game.players[0];
		expect(player.hand.length).toBe(5);

		game.drawPhase();

		// add chapel card
		const card = game.cards.chapel;
		player.hand.push(card);

		expect(player.hand.length).toBe(7);

		// play chapel card
		game.playActionCard(player, 0, card);
		expect(game.phase).toBe("trash");
		expect(game.trashType).toBe("any");
		expect(game.numTrash).toBe(4);

		// trash 4 cards
		game.trashCards(player, [0, 1, 2, 3]);
		game.endActionCardPhase();
		expect(game.phase).toBe("action");

		// now should have 2 cards (-4 cards, -1 chapel card)
		expect(player.hand.length).toBe(2);
		expect(game.trash.length).toBe(4);
		expect(player.discard.length).toBe(1);
	});

	test("test feast - trash self", () => {
		const supply = ["feast", "festival"];
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

		// 5 cards
		const player = game.players[0];

		// +1 card
		const card = game.cards.feast;
		player.hand.push(card);

		// +1 card
		game.drawPhase();

		expect(player.hand.length).toBe(7);

		game.playActionCard(player, 0, card);
		expect(player.hand.length).toBe(6);
		expect(game.trash.length).toBe(1);
		expect(game.phase).toBe("gain");
		expect(game.maxGainCost).toBe(5);

		game.gainCardWithCheck("festival", 0);
		game.endActionCardPhase();
		expect(game.phase).toBe("action");

		// feast
		expect(game.trash.length).toBe(1);

		// festival
		expect(player.discard.length).toBe(1);
	});

	test("test lab, village, market - multiple buys per turn", () => {
		const supply = ["laboratory", "village", "market"];
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

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

	test("test workshop - gain card with restrictions", () => {
		const supply = ["workshop", "smithy"];
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

		const player = game.players[0];
		const card = game.cards.workshop;
		player.hand.push(card);

		game.drawPhase();

		expect(player.hand.length).toBe(7);

		game.playActionCard(player, 0, card);
		expect(game.maxGainCost).toBe(4);
		expect(game.phase).toBe("gain");

		game.gainCard("smithy", 0);

		// smithy and workshop
		expect(player.discard.length).toBe(2);

		game.endActionCardPhase();
		expect(game.phase).toBe("action");
	});

	test("test remodel - trash & gain phase", () => {
		const supply = ["remodel"];
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

		// 5 cards
		const player = game.players[0];

		// +2 cards
		const card = game.cards.remodel;
		player.hand.push(card);
		// predictable card index
		const estateCard = game.cards.estate;
		player.hand.push(estateCard);

		// +1 card
		game.drawPhase();

		expect(player.hand.length).toBe(8);

		game.playActionCard(player, 0, card);
		expect(game.phase).toBe("trash");
		expect(game.numTrash).toBe(1);

		// find the first estate card
		let estateIndex = 0;
		for(let i = 0; i < player.hand.length; i++) {
			if(player.hand[i].name === "estate") {
				estateIndex = i;
				break;
			}
		}

		expect(player.hand[estateIndex].name).toBe("estate");

		game.trashCards(player, [estateIndex]);
		game.endActionCardPhase();
		expect(game.phase).toBe("gain");
		expect(game.maxGainCost).toBe(4);

		// gain a card costing up to 2 more than it
		// so that's 4
		game.gainCardWithCheck("smithy", 0);
		game.endActionCardPhase();
		expect(game.phase).toBe("action");

		// estate
		expect(game.trash.length).toBe(1);
		// smithy and remodel
		expect(player.discard.length).toBe(2);
	});

	test("test mine - trash and gain treasure", () => {
		const supply = ["mine"];
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

		// 5 cards
		const player = game.players[0];

		// +2 cards
		const card = game.cards.mine;
		player.hand.push(card);
		const silver = game.cards.silver;
		player.hand.push(silver);

		// +1 card
		game.drawPhase();

		expect(player.hand.length).toBe(8);

		game.playActionCard(player, 0, card);
		expect(game.phase).toBe("trash");
		expect(game.numTrash).toBe(1);

		// silver has index 6 because mine has just been spent
		expect(player.hand[5].name).toBe("silver");
		game.trashCards(player, [5]);
		game.endActionCardPhase();
		expect(game.phase).toBe("gain");
		expect(game.maxGainCost).toBe(6);

		// gain a card costing up to 3 more than it
		// so that's 6
		game.gainCardWithCheck("gold", 0);
		game.endActionCardPhase();
		expect(game.phase).toBe("action");

		// silver
		expect(game.trash.length).toBe(1);
		// gold and mine
		expect(player.discard.length).toBe(2);
	});

	test("test cellar - discard 5 and draw 5", () => {
		const supply = ["cellar"];
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

		// 5 cards
		const player = game.players[0];

		// +1 card
		const card = game.cards.cellar;
		player.hand.push(card);

		// +1 card
		game.drawPhase();

		expect(player.hand.length).toBe(7);
		expect(game.phase).toBe("action");

		expect(card.name).toBe("cellar");
		game.playActionCard(player, 0, card);
		expect(game.phase).toBe("discard");

		game.discardCards(player, [0, 1, 2, 3, 4]);
		// 5 cards + cellar
		expect(player.discard.length).toBe(6);

		// -6 cards
		expect(player.hand.length).toBe(1);

		game.endActionCardPhase();
		// +5 cards
		expect(player.hand.length).toBe(7);
		expect(game.phase).toBe("action");
	});

	test("test witch - other players gain cards", () => {
		const supply = ["witch"];
		const playerIndex = 0;
		const game = new Game({
			numPlayers: 4,
			humanPlayerIndex: playerIndex,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));
		expect(game.numPlayers).toBe(4);

		// 5 cards
		const player = game.players[0];

		// +1 card
		const card = game.cards.witch;
		player.hand.push(card);

		// +1 card
		game.drawPhase();

		expect(player.hand.length).toBe(7);
		expect(game.phase).toBe("action");

		expect(card.name).toBe("witch");
		game.playActionCard(player, 0, card);
		expect(game.phase).toBe("action");

		// 7 - 1 (witch played) + 2 (cards drawn)
		expect(player.hand.length).toBe(8);
		expect(player.discard.length).toBe(1);

		// verify that all other players have a curse card in discard pile
		for(let i = 0; i < game.numPlayers; i++) {
			if(i != playerIndex) {
				expect(game.players[i].discard.length).toBe(1);
				const discardedCard = game.players[i].discard[0];
				expect(discardedCard.name).toBe("curse");
			}
		}
	});

	test("test gardens - victory card with effect", () => {
		const supply = ["gardens"];
		const players = [
			new Player(
				"do nothing AI - gardens",
				new DoNothingStrategy()
			),
			new Player(
				"test 2",
				new SimpleTestStrategy()
			)
		];
		const game = new Game({
			numPlayers: 2,
			players: players,
			supplyCards: supply,
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

		const player = game.players[0];
		// add 3 gardens cards to player 0
		for(let i = 0; i < 3; i++) {
			player.hand.push(game.cards.gardens);
		}

		while(!game.isGameOver) {
			game.doTurn();
		}

		// player 0 should have precisely 10 cards
		const allCards = player.deck.concat(player.hand, player.discard);
		expect(allCards.length).toBe(13);

		game.calculateGameEnd();
		// 3 gardens + 3 estates
		expect(player.points).toBe(6);
	});

	test("implement merchant card 'in code'", () => {
		const supply = ["merchant"];
		const game = new Game({
			numPlayers: 2,
			humanPlayerIndex: 0,
			humanPlayerName: "test human",
			supplyCards: supply
		});
		expect(Object.keys(game.supply)).toEqual(expect.arrayContaining(supply));

		// 5 cards
		const player = game.players[0];

		// +2 cards
		const card = game.cards.merchant;
		player.hand.push(card);
		const silver = game.cards.silver;
		player.hand.push(silver);

		// +1 card
		game.drawPhase();

		expect(player.hand.length).toBe(8);

		const cardEffect = game.playActionCard(player, 0, card);
		expect(cardEffect.firstPlayBonus).toHaveProperty("silver");
		const bonusGold = cardEffect.firstPlayBonus.silver.gold;

		game.endActionPhase();

		// 5 because merchant already played
		expect(player.hand[5]).toBe(silver);
		game.playTreasureCard(5);

		expect(game.treasurePot).toBe(bonusGold + silver.value);
	});
});