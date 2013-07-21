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

Stash.prototype.hasCard = function (name) {
	return name in this.stash && this.stash[name] > 0;
};

Stash.prototype.countCard = function (name) {
	return this.stash[name];
};

Stash.prototype.getCard = function (name) {
	if (this.hasCard (name)) {
		this.stash[name]--;
		
		if (this.stash[name] == 0) {
			this.numEmpties++;
		}
		
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
	} else {
		return null;
	}
};