/* global angular, _, BigMoneyStrategy */

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

		/** **************** PLAYER STRATEGIES ********** */

		/**
		 * Same as big money, but buy duchies near the end
		 */
		$scope.smartBigMoney = function () {
			this.actionTurn = function () {
				return null;
			};

			this.buyTurn = function (p) {
				const money = $scope.moneyInHand(p);

				// should make sure that these piles exist first, but whatevs...
				if (money >= 8) {
					return "province";
				} if (money >= 6) {
					if ($scope.deck.province >= 5) {
						return "gold";
					}
					return "duchy";
				} if (money >= 3) {
					return "silver";
				}
				return null;
			};
		};

		/**
		 * Always go for province when you have 8
		 * Always go for duchy when you have 5
		 * Always go for smithy when you have 4
		 * Always go for silver when you have 3
		 * Go for gold when you have 6, if there are 4 or more provinces left, otherwise buy a duchy
		 */
		$scope.smartDuchy = function () {
			this.actionTurn = function (p) {
				// if I have an action card, play it
				const { hand } = $scope.players[p];
				for (let i = 0; i < hand.length; i++) {
					if (hand[i].type === "action") {return hand[i];}
				}

				return null;
			};

			this.buyTurn = function (p) {
				const money = $scope.moneyInHand(p);

				if (money >= 8) {
					return "province";
				} if (money >= 6) {
					if ($scope.deck.province >= 4) {
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
			};
		};

		$scope.smartSmithy = function () {
			this.avgValue = 0.7;
			this.numCards = 10;
			this.provinceCutoff = 4;

			this.addValue = function (v) {
				this.avgValue = (this.numCards * this.avgValue + v) / (this.numCards + 1);
				this.numCards++;
			};

			this.actionTurn = function (p) {
				// if I have an action card, play it
				const { hand } = $scope.players[p];
				for (let i = 0; i < hand.length; i++) {
					if (hand[i].type === "action") {return hand[i];}
				}

				return null;
			};

			this.buyTurn = function (p) {
				const money = $scope.moneyInHand(p);
				const card = this.buyTurnWrapper(p, money);
				if (card !== null) {
					// console.log("avgValue = %f", this.avgValue);
					// console.log("Player 'smart smithy' buys %s with %d", card, money);
				}
				return card;
			};

			this.buyTurnWrapper = function (p, money) {
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
					if ($scope.deck.province >= this.provinceCutoff) {
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
			};
		};

		$scope.bigMoneySmithy = function () {
			this.numSmithy = 0;

			this.actionTurn = function (p) {
				// if I have an action card, play it
				const { hand } = $scope.players[p];
				for (let i = 0; i < hand.length; i++) {
					if (hand[i].type === "action") {return hand[i];}
				}

				return null;
			};

			this.buyTurn = function (p) {
				const money = $scope.moneyInHand(p);
				// console.log("On round %d, I hold %d cards in hand", $scope.round, $scope.players[p].hand.length);

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
			};
		};

		$scope.pointsOnly = function () {
			this.actionTurn = function () {
				return null;
			};

			this.buyTurn = function (p) {
				const money = $scope.moneyInHand(p);

				if (money >= 8) {
					return "province";
				} if (money >= 5) {
					return "duchy";
				} if (money >= 2) {
					return "estate";
				}
				return null;
			};
		};
		/** ********************************************* */

		/**
		 * Initialize mapping of card names to cards.
		 */
		$scope.initCards = function () {
			// treasures
			$scope.cards.copper = {
				name: "copper",
				cost: 0,
				type: "treasure",
				value: 1,
			};
			$scope.cards.silver = {
				name: "silver",
				cost: 3,
				type: "treasure",
				value: 2,
			};
			$scope.cards.gold = {
				name: "gold",
				cost: 6,
				type: "treasure",
				value: 3,
			};

			// point cards
			$scope.cards.estate = {
				name: "estate",
				cost: 2,
				type: "point",
				points: 1,
			};
			$scope.cards.duchy = {
				name: "duchy",
				cost: 5,
				type: "point",
				points: 3,
			};
			$scope.cards.province = {
				name: "province",
				cost: 8,
				type: "point",
				points: 6,
			};

			$scope.cards.smithy = {
				name: "smithy",
				cost: 4,
				type: "action",
				effect: $scope.smithy,
			};
		};

		$scope.initDeck = function () {
			// just some numbers...
			$scope.deck.copper = 60;
			$scope.deck.silver = 40;
			$scope.deck.gold = 30;

			$scope.deck.estate = 20;
			$scope.deck.duchy = 12;
			$scope.deck.province = 12;

			$scope.deck.smithy = 10;
		};

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
				new $scope.smartBigMoney()
			);

			$scope.players[2] = new Player(
				"Big Money with Smithy",
				new $scope.bigMoneySmithy()
			);

			$scope.players[3] = new Player(
				"Smart Smithy",
				new $scope.smartSmithy()
			);

			$scope.players[4] = new Player(
				"Smart Duchy",
				new $scope.smartDuchy()
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
		 * Return null on failure, card on success
		 */
		$scope.takeCard = function (cardName, player) {
			// console.log("Taking card %s", cardName);
			if ($scope.deck[cardName] === 0) {return null;}

			$scope.deck[cardName]--;
			const card = $scope.cards[cardName];

			// points are added on here
			if (card.type === "point") {
				$scope.players[player].points += card.points;
			}

			return card;
		};

		/**
		 * Draw a card from the deck.
		 * If the deck is empty, shuffle in cards from discard pile
		 * Return false iff discard and deck are both empty
		 */
		$scope.drawCard = function (player) {
			if ($scope.players[player].cards.length === 0) {
				$scope.players[player].cards = _.shuffle($scope.players[player].discard);
				$scope.players[player].discard = [];
			}

			if ($scope.players[player].cards.length === 0) {return false;}

			const card = $scope.players[player].cards.pop();
			$scope.players[player].hand.push(card);
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

			$scope.initCards();
			$scope.initDeck();

			$scope.initPlayers();
			$scope.dealHands();
			$scope.turn = 0;
			$scope.round = 0;
			$scope.gameOver = false;
			$scope.simMode = false;

			$scope.winArr = [];
		};

		$scope.moneyInHand = function (player) {
			const { hand } = $scope.players[player];
			let money = 0;
			for (let i = 0; i < hand.length; i++) {
				if (hand[i].type === "treasure") {
					money += hand[i].value;
				}
			}
			return money;
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

		$scope.runRounds = function () {
			const numRounds = 200;

			const winners = {};
			for (let p = 0; p < $scope.numPlayers; p++) {
				winners[$scope.players[p].name] = 0;
			}

			for (let r = 0; r < numRounds; r++) {
				$scope.resetSim();
				$scope.doSim();

				for (let i = 0; i < $scope.winArr.length; i++) {
					winners[$scope.winArr[i].name] += 1;
				}
			}

			console.log(winners);
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
			const action = player.strategy.actionTurn(p);
			if (action != null) {
				console.log(`Player ${p} played action card ${action.name} on round ${$scope.round}`);
				action.effect(p);
			}

			// buy phase
			const cardName = player.strategy.buyTurn(p, player);
			if (cardName != null) {
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
