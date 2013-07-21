function Coin (name) {
	this.name = name;
	
	this.cost = {
		"copper" : 0,
		"silver" : 3,
		"gold" : 6
	} [this.name];
	
	this.val = {
		"copper" : 1,
		"silver" : 2,
		"gold" : 6
	} [this.name];
	
	this.type = "coin";
}

Coin.cards = [
	"copper",
	"silver",
	"gold"
]

function Point (name) {
	this.name = name;
	
	this.cost = {
		"estate" : 0,
		"duchy" : 5,
		"province" : 8
	} [this.name];
	
	this.points = {
		"estate" : 1,
		"duchy" : 3,
		"province" : 6
	} [this.name];
	
	this.type = "point";
}

Point.cards = [
	"estate",
	"duchy",
	"province"
];

function Action (name, args) {
	this.name = name;
	
	this.args = args;
	this.type = "action";
};

Action.cards = [
	"smithy",
	"laboratory",
	"market"
];

Action.prototype.getArgBonus = function (arg) {
	if (arg in this.args) {
		return this.args[arg];
	} else {
		return 0;
	}
};

Action.prototype.getDrawBonus = function () {
	return this.getArgBonus("draw");
};

Action.prototype.getActionBonus = function () {
	return this.getArgBonus("action");
};

Action.prototype.getFundBonus = function () {
	return this.getArgBonus("fund");
};

Action.prototype.getBuyBonus = function () {
	return this.getArgBonus("buy");
};

/**
 * @param {String}
 * @returns {Action}
 */
Action.getCard = function (name) {
	var cards = {
		"smithy" : {"draw" : 3},
		"laboratory" : {"draw" : 2, "action" : 1},
		"market" : {"draw" : 1, "action" : 1, "buy" : 1},
	};
	
	return new Action(name, cards[name]);
};
