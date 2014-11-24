angular.module("dominionApp", [])
.controller("handController", function ($scope) {
    $scope.players = [];
    $scope.deck = {};
    $scope.cards = {};
    $scope.numPlayers = 0;
    $scope.turn = 0;
    $scope.round = 0;
    $scope.gameOver = false;

    $scope.simMode = false;
    $scope.simDelay = 0;

    /***************** CARD EFFECTS *****************/
    $scope.smithy = function (p) {
        // draw 3 cards

        for (var i = 0; i < 3; i++) {
            $scope.drawCard(p);
        }
    };
    /************************************************/

    /****************** PLAYER STRATEGIES ***********/
    $scope.bigMoney = function () {
        this.actionTurn = function (p) {
            return null;
        };

        this.buyTurn = function (p) {
            var money = $scope.moneyInHand(p);

            // should make sure that these piles exist first, but whatevs...
            if (money >= 8) {
                return "province";
            } else if (money >= 6) {
                return "gold";
            } else if (money >= 3) {
                return "silver";
            } else {
                return null;
            }
        };
    };

    /**
     * Same as big money, but buy dutchies near the end
     */
    $scope.smartBigMoney = function () {
        this.actionTurn = function (p) {
            return null;
        };

        this.buyTurn = function (p) {
            var money = $scope.moneyInHand(p);

            // should make sure that these piles exist first, but whatevs...
            if (money >= 8) {
                return "province";
            } else if (money >= 6) {
                if ($scope.deck["province"] >= 5) {
                    return "gold";
                } else {
                    return "dutchy";
                }
            } else if (money >= 3) {
                return "silver";
            } else {
                return null;
            }
        };
    };

    /**
     * Always go for province when you have 8
     * Always go for dutchy when you have 5
     * Always go for smithy when you have 4
     * Always go for silver when you have 3
     * Go for gold when you have 6, if there are 4 or more provinces left, otherwise buy a dutchy
     */
    $scope.smartDutchy = function () {
        this.actionTurn = function (p) {
            // if I have an action card, play it
            var hand = $scope.players[p].hand;
            for (var i = 0; i < hand.length; i++) {
                if (hand[i].type === "action") return hand[i];
            }

            return null;
        };

        this.buyTurn = function (p) {
            var money = $scope.moneyInHand(p);

            if (money >= 8) {
                return "province";
            } else if (money >= 6) {
                if ($scope.deck["province"] >= 4) {
                    return "gold";
                } else {
                    return "dutchy";
                }
            } else if (money >= 5) {
                return "dutchy";
            } else if (money >= 4) {
                return "smithy";
            } else if (money >= 3) {
                return "silver";
            } else {
                return null;
            }
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
            var hand = $scope.players[p].hand;
            for (var i = 0; i < hand.length; i++) {
                if (hand[i].type === "action") return hand[i];
            }

            return null;
        };

        this.buyTurn = function (p) {
            var money = $scope.moneyInHand(p);
            var card = this.buyTurnWrapper(p, money);
            if (card !== null) {
                //console.log("avgValue = %f", this.avgValue);
                //console.log("Player 'smart smithy' buys %s with %d", card, money);
            }
            return card;
        };

        this.buyTurnWrapper = function (p, money) {
            // calculate the avg value of coins in my deck
            // if the avg value is > (let's say 2)
            //
            var valueDrawThree = this.avgValue * 3;
            //var valueWithGold = (this.avgValue * this.numCards + 3) / (this.numCards + 1);
            //var valueWithSilver = (this.avgValue * this.numCards + 2) / (this.numCards + 1);

            if (money >= 8) {
                this.addValue(0);
                return "province";
            } else if (money >= 6 && 3 >= valueDrawThree) {
                if ($scope.deck["province"] >= this.provinceCutoff) {
                    this.addValue(3);
                    return "gold";
                } else {
                    this.addValue(0);
                    return "dutchy";
                }
            } else if (money >= 4 && 2 >= valueDrawThree) {
                this.addValue(2);
                return "silver";
            } else if (money >= 4) {
                this.addValue(0);
                return "smithy";
            } else if (money >= 3) {
                this.addValue(2);
                return "silver";
            } else {
                return null;
            }
        };
    };

    $scope.bigMoneySmithy = function () {
        this.numSmithy = 0;

        this.actionTurn = function(p) {
            // if I have an action card, play it
            var hand = $scope.players[p].hand;
            for (var i = 0; i < hand.length; i++) {
                if (hand[i].type === "action") return hand[i];
            }

            return null;
        };

        this.buyTurn = function (p) {
            var money = $scope.moneyInHand(p);
            //console.log("On round %d, I hold %d cards in hand", $scope.round, $scope.players[p].hand.length);

            // should make sure that these piles exist first, but whatevs...
            if (money >= 8) {
                return "province";
            } else if (money >= 6) {
                return "gold";
            } else if (money >= 4 && this.numSmithy < 3) {
                this.numSmithy++;

                return "smithy";
            } else if (money >= 3) {
                return "silver";
            } else {
                return null;
            }
        };
    };

    $scope.pointsOnly = function () {
        this.actionTurn = function (p) {
            return null;
        };

        this.buyTurn = function (p) {
            var money = $scope.moneyInHand(p);

            if (money >= 8) {
                return "province";
            } else if (money >= 5) {
                return "dutchy";
            } else if (money >= 2) {
                return "estate";
            } else {
                return null;
            }
        };
    };
    /************************************************/

    /**
     * Initialize mapping of card names to cards.
     */
    $scope.initCards = function () {
        // treasures
        $scope.cards["copper"] = {
            name: "copper",
            cost: 0,
            type: "treasure",
            value: 1
        };
        $scope.cards["silver"] = {
            name: "silver",
            cost: 3,
            type: "treasure",
            value: 2
        };
        $scope.cards["gold"] = {
            name: "gold",
            cost: 6,
            type: "treasure",
            value: 3
        };

        // point cards
        $scope.cards["estate"] = {
            name: "estate",
            cost: 2,
            type: "point",
            points: 1
        };
        $scope.cards["dutchy"] = {
            name: "dutchy",
            cost: 5,
            type: "point",
            points: 3
        };
        $scope.cards["province"] = {
            name: "province",
            cost: 8,
            type: "point",
            points: 6
        };

        $scope.cards["smithy"] = {
            name: "smithy",
            cost: 4,
            type: "action",
            effect: $scope.smithy
        };
    };

    $scope.initDeck = function () {
        // just some numbers...
        $scope.deck["copper"] = 60;
        $scope.deck["silver"] = 40;
        $scope.deck["gold"] = 30;

        $scope.deck["estate"] = 20;
        $scope.deck["dutchy"] = 12;
        $scope.deck["province"] = 12;

        $scope.deck["smithy"] = 10;
    };

    $scope.initPlayers = function () {
        $scope.numPlayers = 5;

        // create generic player objects
        for (var i = 0; i < $scope.numPlayers; i++) {
            $scope.players[i] = {
                cards: [],
                hand: [],
                discard: [],
                points: 0
            };
        }

        // specialize them with strategy
        $scope.players[0].strategy = new $scope.bigMoney();
        $scope.players[0].name = "Big Money";

        //$scope.players[1].strategy = new $scope.pointsOnly();
        //$scope.players[1].name = "Points Only";
        $scope.players[1].strategy = new $scope.smartBigMoney();
        $scope.players[1].name = "Smart Big Money";

        $scope.players[2].strategy = new $scope.bigMoneySmithy();
        $scope.players[2].name = "Big Money with Smithy";

        $scope.players[3].strategy = new $scope.smartSmithy();
        $scope.players[3].name = "Smart Smithy";

        $scope.players[4].strategy = new $scope.smartDutchy();
        $scope.players[4].name = "Smart Dutchy";

        // give them their initial cards
        for (var p = 0; p < $scope.numPlayers; p++) {

            // 3 estates and 7 coppers
            for (var i = 0; i < 3; i++) {
                var card = $scope.takeCard("estate", p);
                $scope.players[p].cards.push(card);
            }
            for (var j = 0; j < 7; j++) {
                var card = $scope.takeCard("copper", p);
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
    $scope.takeCard = function(cardName, player) {
        "use strict";

        //console.log("Taking card %s", cardName);
        if ($scope.deck[cardName] === 0) return null;

        $scope.deck[cardName]--;
        var card = $scope.cards[cardName];

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
        "use strict";

        if ($scope.players[player].cards.length === 0) {
            $scope.players[player].cards = _.shuffle($scope.players[player].discard);
            $scope.players[player].discard = [];
        }

        if ($scope.players[player].cards.length === 0) return false;

        var card = $scope.players[player].cards.pop();
        $scope.players[player].hand.push(card);
        return true;
    };

    $scope.dealHands = function () {
        for (var p = 0; p < $scope.numPlayers; p++) {
            for (var i = 0; i < 5; i++) {
                $scope.drawCard(p);
            }
        }
    };

    $scope.resetSim = function () {
        "use strict";

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

    $scope.moneyInHand = function(player) {
        var hand = $scope.players[player].hand;
        var money = 0;
        for (var i = 0; i < hand.length; i++) {
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
        //console.log("Player %d trying to buy card %s", player, cardName);

        // TODO for now assume players are honest and have enough money to buy

        var card = $scope.takeCard(cardName, player);
        if (card === null) {
            return false;
        } else {
            $scope.players[player].discard.push(card);
            return true;
        }
    };

    /**
     * For now, this only checks the province pile
     */
    $scope.checkGameEnd = function () {
        return $scope.deck["province"] === 0;
    };

    $scope.runRounds = function () {
        var numRounds = 200;

        var winners = {};
        for (var p = 0; p < $scope.numPlayers; p++) {
            winners[$scope.players[p].name] = 0;
        }

        for (var r = 0; r < numRounds; r++) {
            $scope.resetSim();
            $scope.doSim();

            for (var i = 0; i < $scope.winArr.length; i++) {
                winners[$scope.winArr[i].name] += 1;
            }
        }

        console.log(winners);
    };

    $scope.doSim = function () {
        $scope.simMode = true;
        while (! $scope.gameOver) {
            $scope.doTurn();
        }
        $scope.simMode = false;
    };

    $scope.doTurn = function () {
        if ($scope.gameOver) return;

        var p = $scope.turn;
        if (p === 0) $scope.round++;

        // draw a card
        $scope.drawCard(p);

        // action phase
        var strategy = $scope.players[p].strategy;
        var action = strategy.actionTurn(p);
        if (action != null) {
            console.log("Player %d played action card %s on round %d", p, action.name, $scope.round);
            action.effect(p);
        }

        // buy phase
        var cardName = strategy.buyTurn(p);
        if (cardName != null) {
            var money = $scope.moneyInHand(p);
            //console.log("Player %d bought card %s on round %d (money %d)", p, cardName, $scope.round, money);
            $scope.buyCard(cardName, p);
        } else {
            console.log("Player %d does not buy anything this turn", p);
        }

        // cleanup phase: discard whole hand
        while($scope.players[p].hand.length > 0) {
            var c = $scope.players[p].hand.pop();
            $scope.players[p].discard.push(c);
        }

        // draw 5 new cards
        for (var i = 0; i < 5; i++) {
            $scope.drawCard(p);
        }

        if ($scope.checkGameEnd()) {
            $scope.gameOver = true;

            var bestScore = 0;

            for (var i = 0; i < $scope.numPlayers; i++) {
                bestScore = Math.max($scope.players[i].points, bestScore);
            }

            console.log("bestScore = %d", bestScore);

            $scope.winArr = [];

            for (var i = 0; i < $scope.numPlayers; i++) {
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
