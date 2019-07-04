/* global angular, _, BigMoneyStrategy, SmartBigMoneyStrategy, SmartDuchyStrategy, SmartSmithyStrategy, BigMoneySmithyStrategy */

class Player {
	/**
	 * @param {String} name
	 * @param {PlayerStrategy} strategy
	 */
	constructor(name, strategy) {
		this.name = name;
		this.strategy = strategy;
		this.cards = [];
		this.hand = [];
		this.discard = [];
		this.points = 0;
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

angular.module("dominionApp", [])
	.controller("handController", ($scope) => {
		// array of player objects
		$scope.players = [];

		// map from card names to their quantity in the deck
		$scope.deck = {};

		// map from card names to their properties
		$scope.cards = {};

		$scope.numPlayers = 0;

		// index into $scope.players
		$scope.turn = 0;

		$scope.round = 0;
		$scope.gameOver = false;

		$scope.simMode = false;
		$scope.simDelay = 0;

		/** *************** CARD EFFECTS **************** */
		$scope.smithy = function (p) {
			// draw 3 cards

			for (let i = 0; i < 3; i++) {
				$scope.drawCard(p);
			}
		};
		/** ********************************************* */

		/**
		 * Initialize mapping of card names to cards.
		 */
		$scope.initCards = function () {
			const cards = {};

			// treasures
			cards.copper = {
				name: "copper",
				cost: 0,
				type: "treasure",
				value: 1,
			};
			cards.silver = {
				name: "silver",
				cost: 3,
				type: "treasure",
				value: 2,
			};
			cards.gold = {
				name: "gold",
				cost: 6,
				type: "treasure",
				value: 3,
			};

			// point cards
			cards.estate = {
				name: "estate",
				cost: 2,
				type: "point",
				points: 1,
			};
			cards.duchy = {
				name: "duchy",
				cost: 5,
				type: "point",
				points: 3,
			};
			cards.province = {
				name: "province",
				cost: 8,
				type: "point",
				points: 6,
			};

			cards.smithy = {
				name: "smithy",
				cost: 4,
				type: "action",
				effect: $scope.smithy,
			};

			return cards;
		};

		/**
		 * Initialize mapping of card names to their quantity
		 */
		$scope.initDeck = function () {
			const deck = {};
			// just some numbers...
			deck.copper = 60;
			deck.silver = 40;
			deck.gold = 30;

			deck.estate = 20;
			deck.duchy = 12;
			deck.province = 12;

			deck.smithy = 10;
			return deck;
		};

		/**
		 * 1. Set numPlayers
		 * 2. Initialize player array with AI and strategies
		 * 3. Give players their initial cards (3 estates and 7 coppers) - shuffled
		 */
		$scope.initPlayers = function () {
			$scope.numPlayers = 5;

			// create generic player objects
			for (let i = 0; i < $scope.numPlayers; i++) {
				$scope.players[i] = {
					cards: [],
					hand: [],
					discard: [],
					points: 0,
				};
			}

			// specialize them with strategy
			$scope.players[0] = new Player(
				"Big Money",
				new BigMoneyStrategy()
			);

			$scope.players[1] = new Player(
				"Smart Big Money",
				new SmartBigMoneyStrategy()
			);

			$scope.players[2] = new Player(
				"Big Money with Smithy",
				new BigMoneySmithyStrategy()
			);

			$scope.players[3] = new Player(
				"Smart Smithy",
				new SmartSmithyStrategy()
			);

			$scope.players[4] = new Player(
				"Smart Duchy",
				new SmartDuchyStrategy()
			);

			console.log($scope.players);

			// give them their initial cards
			for (let p = 0; p < $scope.numPlayers; p++) {
				// 3 estates and 7 coppers
				for (let i = 0; i < 3; i++) {
					let card = $scope.takeCard("estate", p);
					$scope.players[p].cards.push(card);
				}
				for (let j = 0; j < 7; j++) {
					let card = $scope.takeCard("copper", p);
					$scope.players[p].cards.push(card);
				}

				// and shuffle
				$scope.players[p].cards = _.shuffle($scope.players[p].cards);
			}
		};

		/**
		 * Remove card from deck.
		 * @param {string} cardName
		 * @param {number} playerIndex
		 * @returns {string | null} Return null on failure, card on success
		 */
		$scope.takeCard = function (cardName, playerIndex) {
			if ($scope.deck[cardName] === 0) {
				return null;
			}
			const player = $scope.players[playerIndex];

			$scope.deck[cardName]--;
			const card = $scope.cards[cardName];

			// points are added on here
			if (card.type === "point") {
				player.points += card.points;
			}

			return card;
		};

		/**
		 * Draw a card from the player's deck deck.
		 * If the deck is empty, shuffle in cards from discard pile
		 * @param {number} playerIndex
		 * @returns {boolean} Return false iff discard and deck are both empty
		 */
		$scope.drawCard = function (playerIndex) {
			const player = $scope.players[playerIndex];
			if (player.cards.length === 0) {
				// the player has run out of cards
				// set the player's cards as a shuffled version of their discard pile
				player.cards = _.shuffle(player.discard);
				player.discard = [];
			}

			if (player.cards.length === 0) {
				return false;
			}

			const card = player.cards.pop();
			player.hand.push(card);

			return true;
		};

		$scope.dealHands = function () {
			for (let p = 0; p < $scope.numPlayers; p++) {
				for (let i = 0; i < 5; i++) {
					$scope.drawCard(p);
				}
			}
		};

		$scope.resetSim = function () {
			console.log("reset");

			$scope.cards = $scope.initCards();
			$scope.deck = $scope.initDeck();

			$scope.initPlayers();
			$scope.dealHands();
			$scope.turn = 0;
			$scope.round = 0;
			$scope.gameOver = false;
			$scope.simMode = false;

			$scope.winArr = [];
		};

		/**
		 * Return true iff successful (enough cards remaining)
		 * No honesty check
		 */
		$scope.buyCard = function (cardName, player) {
			// console.log("Player %d trying to buy card %s", player, cardName);

			// TODO for now assume players are honest and have enough money to buy

			const card = $scope.takeCard(cardName, player);
			if (card === null) {
				return false;
			}
			$scope.players[player].discard.push(card);
			return true;
		};

		/**
		 * For now, this only checks the province pile
		 */
		$scope.checkGameEnd = function () {
			return $scope.deck.province === 0;
		};

		/**
		 * Run until the end of this round
		 */
		$scope.doRound = function () {
			const round = $scope.round;
			while(($scope.round === round) && !$scope.gameOver) {
				$scope.doTurn();
			}
		};

		$scope.doSim = function () {
			$scope.simMode = true;
			while (!$scope.gameOver) {
				$scope.doTurn();
			}
			$scope.simMode = false;
		};

		$scope.doTurn = function () {
			if ($scope.gameOver) { return; }

			const p = $scope.turn;
			if (p === 0) { $scope.round++; }

			// draw a card
			$scope.drawCard(p);

			// action phase
			const player = $scope.players[p];
			const action = player.strategy.actionTurn(player);
			if (action != null) {
				console.log(`Player ${p} played action card ${action.name} on round ${$scope.round}`);
				action.effect(p);
			}

			// buy phase
			const cardName = player.strategy.buyTurn(player, $scope.deck);
			if (cardName) {
				// const money = $scope.moneyInHand(p);
				// console.log("Player %d bought card %s on round %d (money %d)", p, cardName, $scope.round, money);
				$scope.buyCard(cardName, p);
			} else {
				console.log(`Player ${p} does not buy anything this turn`);
			}

			// cleanup phase: discard whole hand
			while ($scope.players[p].hand.length > 0) {
				const c = $scope.players[p].hand.pop();
				$scope.players[p].discard.push(c);
			}

			// draw 5 new cards
			for (let i = 0; i < 5; i++) {
				$scope.drawCard(p);
			}

			if ($scope.checkGameEnd()) {
				$scope.gameOver = true;

				let bestScore = 0;

				for (let i = 0; i < $scope.numPlayers; i++) {
					bestScore = Math.max($scope.players[i].points, bestScore);
				}

				console.log("bestScore = %d", bestScore);

				$scope.winArr = [];

				for (let i = 0; i < $scope.numPlayers; i++) {
					if ($scope.players[i].points === bestScore) {
						$scope.winArr.push($scope.players[i]);
					}
				}

				console.log("done");
			} else {
				$scope.turn = ($scope.turn + 1) % $scope.numPlayers;
			}
		};

		$scope.resetSim();
	});
