/**
 * Where all the cards are kept before they are bought.
 */
function Stash () {
	// create a pile for each card
	this.stash = {};
	this.numEmpties = 0;
	
	var types = {"points" : Point.cards, "coins" : Coin.cards, "actions" : Action.cards };
	var n;
	
	for (type in types) {
		var cards = types[type];
		
		for (var i = 0; i < cards.length; i++) {
			if (type == "points") {
				n = 12;
			} else if (type == "coins") {
				// TODO don't know how many this should be, setting very high for now
				n = 100;
			} else if (type == "actions") {
				n = 10;
			}
			
			this.stash[cards[i]] = n;
		}
	}
}

/**
 * Return true iff game over.
 * One of two criteria:
 * 	1. 3 piles are empty
 * 	2. Province pile is empty
 */
Stash.prototype.gameOver = function () {
	return this.hasCard("province") == 0 || this.numEmpties === 3;
};

/**
 * Return true iff this card remains in the stash.
 * @param {String} name
 */
Stash.prototype.hasCard = function (name) {
	return name in this.stash && this.stash[name] > 0;
};

/**
 * Return number of occurrences of this card in the stash.
 * @param {Object} name
 */
Stash.prototype.countCard = function (name) {
	return this.stash[name];
};

/**
 * Return the card with the given name WITHOUT removing it from the stash.
 * @param {String} name
 * @returns {Card}
 */
Stash.prototype.peekCard = function (name) {
	if (Coin.cards.indexOf(name) >= 0) {
		return new Coin(name);
	} else if (Point.cards.indexOf(name) >= 0) {
		return new Point(name);
	} else if (Action.cards.indexOf(name) >= 0) {
		return Action.getCard(name);
	} else {
		console.log("unknown card: " + name);
		return null;
	}
};

/**
 * Process removing card with given name from the stash.
 * Return the card
 * @param {String} name
 * @returns {Carrd}
 */
Stash.prototype.getCard = function (name) {
	if (this.hasCard (name)) {
		this.stash[name]--;
		
		if (this.stash[name] == 0) {
			this.numEmpties++;
		}
		
		return this.peekCard(name);
	} else {
		return null;
	}
};