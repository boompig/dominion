/**
 * Create a new player, with a reference to the stash.
 */
function Player (name, stash) {
	/**
	 * @returns {Array}
	 */
	this.deck = Player.getStartingDeck();
	/**
	 * @returns {Array}
	 */
	this.hand = Array ();
	/**
	 * @returns {Array}
	 */
	this.discard = Array ();
	
	/**
	 * @returns {String}
	 */
	this.name = name;
	
	/**
	 * @returns {Stash}
	 */
	this.stash = stash;
	
	this.getNewHand();
	
	/**
	 * What sort of AI this player will be using.
	 * This function should set the functions this.strategyPlayAction and this.strategyBuy
	 * @returns {Function}
	 */
	this.strategy = this.bigMoney;
}

/**
 * Return an unshuffled starting deck as an array.
 */
Player.getStartingDeck = function () {
	var deck = Array(10);
	var i = 0;
	
	for (; i < 3; i++) {
		deck[i] = new Point ("estate");
	}
	
	for (; i < 10; i++) {
		deck[i] = new Coin ("copper");
	}
	
	shuffle(deck);
	return deck;
};

/**
 * Draw a card from the deck. Reshuffle discard pile into deck if necessary.
 * Return null if both discard pile and deck are empty, return the card otherwise
 */
Player.prototype.drawCard = function () {
	if (this.deck.length == 0) {
		if (this.discard.length == 0) {
			console.log("Ran through all deck and discard pile. Failed to draw enough cards");
			return null;
		}
		
		while (this.discard.length > 0) {
			this.deck.push(this.discard.pop());
		}
		
		shuffle(this.deck);
	}
	
	var card = this.deck.pop();
	this.hand.push(card);
	return card;
};

/**
 * Discard current hand.
 * Add cards from deck to hand until number = 5
 * Shuffle discard pile into deck as needed.
 * Return true iff all cards added that should have been.
 */
Player.prototype.getNewHand = function () {
	var card;
	
	// discard hand
	while (this.hand.length > 0) {
		card = this.hand.pop();
		
		if (card)
			this.discard.push(card);
	}
	
	var result = true;
	
	while (this.hand.length < 5 && result) {
		result = this.drawCard();
	}
	
	return result != null;
};

/**
 * Return total amount of coin available to the player this turn.
 * FOR NOW, DOES NOT INCLUDE PLAYED ACTIONS
 */
Player.prototype.getFunds = function () {
	var sum = 0, card;
	
	for (var i = 0; i < this.hand.length; i++) {
		card = this.hand[i];
		
		if (card instanceof Coin) {
			sum += card.val;
		}
	}
	
	return sum;
};

/**
 * Return the card. Add card to discard.
 * Remove 1 of these cards from the stash.
 * Return null if purchase failed.
 */
Player.prototype.buyCard = function (name) {
	var card = null;
	
	if (this.buys === 0) {
		return null;
	}
	
	this.buys--;
	
	if (this.stash.hasCard(name) && this.stash.peekCard(name).cost <= this.funds) {
		card = this.stash.getCard(name);
		this.funds -= card.cost;
		this.discard.push(card);
		
		this.writeConsole("Bought " + card.name, Game.V_MAX - 1);
		
		if (card.name == "province") {
			this.writeConsole(this.stash.countCard("province") + " Provinces left", Game.V_MAX - 1);
		}
	} else {
		card = null;
	}
	
	return card;
};

/**
 * Return the total points for this player.
 * @returns {Number}
 */
Player.prototype.getPoints = function () {
	var points = 0;
	
	var piles = [this.hand, this.deck, this.discard];
	
	for (var p = 0; p < piles.length; p++) {
		for (var i = 0; i < piles[p].length; i++) {
			var card = piles[p][i];
			
			if (card instanceof Point) {
				// this.writeConsole(card.name + "-->" + card.points);
				points += card.points;
			}
		}
	}
	
	return points;
};

/**
 * @param {String} msg
 * @param {Number} v_level (optional)
 */
Player.prototype.writeConsole = function (msg, v_level) {
	if (! v_level) {
		v_level = 1;
	}
	
	GameUI.getInstance().writeConsole(msg, this.name, v_level);
};

Player.prototype.doTurn = function (game) {
	this.funds = 0;
	this.actions = 1;
	this.buys = 1;
	
	var actionCards = this.getActionCards();
	var card = true, name = true;
	
	while (actionCards.length > 0 && this.actions > 0 && card) {
		card = this.strategyPlayAction(actionCards, game);
		
		if (card) {
			// auto-decrement this.actions here
			this.playCard(card);
			
			// remove from actionCards and from hand in general
			actionCards.splice(actionCards.indexOf(card), 1);
			this.hand.splice(this.hand.indexOf(card), 1);
		}
	}
	
	this.funds += this.getFunds();
	
	while (this.buys > 0 && name) {
		name = this.strategyBuy(this.funds, game);
		
		if (name) {
			// auto-decrements this.buys here
			// auto-decrements this.funds here
			this.buyCard(name);
		}
	}
	
	return result = this.strategy (game);
};

/**
 * Return all the cards this player has: deck + discard + hand
 */
Player.prototype.getAllCards = function () {
	return this.hand.concat(this.deck, this.discard);
};

/**
 * Return a mapping of card names to frequency.
 */
Player.prototype.statAllCards = function () {
	var allCards = this.getAllCards();
	var o = {}, name;
	
	for (var i = 0; i < allCards.length; i++) {
		name = allCards[i].name;
		
		if (! (name in o)) {
			o[name] = 0;
		}
		
		o[name] = o[name] += 1;
	}
	
	o["total"] = i;
	
	return o;
};

/**
 * Return true on success of playing card
 * @param {Card} card
 * @returns {Boolean}
 */
Player.prototype.playCard = function (card) {
	"use strict";
	
	if (this.actions == 0) {
		return false;
	}
	
	this.actions --;
	
	this.writeConsole("Played " + card.name);
	
	// draw appropriate number of cards
	for (var i = 0; i < card.getDrawBonus(); i++) {
		var newCard = this.drawCard();
		this.writeConsole("Drew " + newCard.name + " as a result of an action");
	}
	
	// add associated funds for action
	this.funds += card.getFundBonus();
	
	// add associated # of actions to this.actions
	this.actions += card.getActionBonus();
	
	this.buys += card.getBuyBonus();
	
	return true;
};

/**
 * Return how many of the given card type are in the given pile.
 * If pile is not given, search everything
 */
Player.prototype.statCard = function (cardType, pile) {
	var piles, count = 0, card;
	
	if (! pile) {
		pile = this.getAllCards();
	}
	
	for (var i = 0; i < pile.length; i++) {
		card = pile[i];
		if (card.type == cardType) { count++; }
	}
	
	return count;
};



/**
 * Return the action cards in the current hand.
 * @returns {Array}
 */
Player.prototype.getActionCards = function () {
	var actions = [];
	
	for (var i = 0; i < this.hand.length; i++) {
		if (this.hand[i] instanceof Action) {
			actions.push(this.hand[i]);
		}
	}
	
	return actions;
};

Player.prototype.getNumCards = function () {
	return this.hand.length + this.discard.length + this.deck.length;
};

/**
 * Given an array of action cards, return the card to play.
 * @param {Array} actionCards
 */
Player.prototype.strategyPlayAction = function (actionCards, game) {
	// this is a stub method
};

/**
 * Given number of funds available, return name of card to buy.
 * @param {Number} funds
 */
Player.prototype.strategyBuy = function (funds, game) {
	// this is a stub method
};

Player.prototype.setStrategy = function () {
	this.strategy();
};

/**
 * Same as Big Money, except start buying only point cards at the end.
 */
Player.prototype.bigMoneyDrawFinalGreen = function (game) {
	"use strict";
	
	this.strategyPlayAction = function (actionCards, game) {
		if (actionCards.length > 0) {
			return actionCards[0];
		}
	};
	
	this.strategyBuy = function (funds, game) {
		if (this.stash.countCard("province") <= 6) {
			if (funds >= 8) {
				return "province";
			} else if (funds >= 5) {
				return "duchy";
			} else if (funds >= 2) {
				return "estate";
			} 
			
			// do nothing when funds < 2
		} else {
			if (funds >= 8) {
				// buy province
				return "province";
			} else if (funds >= 6) {
				return "gold";
			} else if (funds >= 4 && this.statCard("action") / this.getNumCards() <= 5) {
				return "smithy";
			} else if (funds >= 3) {
				return "silver";
			}
		}
	};
};

/**
 * Modified big money, where Smithy is bought when # cards in the deck % # smithies < 5
 */
Player.prototype.bigMoneyDraw = function (game) {
	"use strict";
	
	this.strategyPlayAction = function (actionCards, game) {
		if (actionCards.length > 0) {
			return actionCards[0];
		}
	};
	
	this.strategyBuy = function (funds, game) {
		if (funds >= 8) {
			// buy province
			return "province";
		} else if (funds >= 6) {
			return "gold";
		} else if (funds >= 4 && this.statCard("action") / this.getNumCards() <= 5) {
			return "smithy";
		} else if (funds >= 3) {
			return "silver";
		}
	};
};

/**
 * Big money strategy, on the turn.
 */
Player.prototype.bigMoney = function (game) {
	"use strict";
	
	this.strategyBuy = function (funds, game) {
		if (funds >= 8) {
			// buy province
			return "province";
		} else if (funds >= 6) {
			return "gold";
		} else if (funds >= 3) {
			return "silver";
		}
	};
};
