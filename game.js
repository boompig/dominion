function Game () {
	this.turn = -1;
	
	/**
	 * @returns {Number}
	 */
	this.numPlayers = 4;
	
	this.stash = new Stash();
	
	this.makePlayers();
}

Game.V_MAX = 5;

/**
 * Level of 'verbosity', where 0 is completely silent, and higher is more stuff
 */
Game.V_LEVEL = 0;

/**
 * @returns {Number}
 */
Game.prototype.playerIndex = function () {
	return this.turn % this.numPlayers;
};

/**
 * @returns {Player}
 */
Game.prototype.currentPlayer = function () {
	return this.players[this.playerIndex()];
};

Game.prototype.makePlayers = function () {
	this.players = Array(this.numPlayers);
	
	// TODO temporary names
	var names = Array("me", "Curly", "Larry", "Joe");
	
	for (var i = 0; i < this.numPlayers; i++) {
		var p = new Player(names[i], this.stash);
		
		if (names[i] == "me") {
			p.strategy = p.bigMoneyDraw;
		}
		
		this.players[i] = p;
	}
};

/**
 * Change the turn information without the player performing the action
 */
Game.prototype.changeTurn = function () {
	this.turn++;
};

Game.prototype.sumPoints = function () {
	var o = {};
	
	for (var i = 0; i < this.players.length; i++) {
		o[this.players[i].name] = this.players[i].getPoints();
	}
	
	return o;
};

Game.prototype.writeConsole = function (msg, v_level) {
	GameUI.getInstance().writeConsole(msg, "game", v_level);
};

Game.prototype.getPlayer = function (name) {
	for (var i = 0; i < this.numPlayers; i++) {
		if (this.players[i].name == name) {
			return this.players[i];
		}
	}
};

/**
 * Return true iff game is over.
 */
Game.prototype.doTurn = function () {
	var player = this.players[this.playerIndex()];
	
	// perform player actions
	player.doTurn();
	
	// cleanup
	player.getNewHand();
	
	// console.log('here');
	
	var gameOver = this.stash.gameOver();
	
	// check for game-ending conditions
	if (gameOver) {
		this.writeConsole("GAME OVER!");
		
		var bestPlayers = [];
		var bestTotal = -1, points;
		var o =  this.sumPoints();
		
		for (playerName in o) {
			points = o[playerName];
			this.writeConsole(playerName + " has " + points + " points");
			
			if (points > bestTotal) {
				bestPlayers = [playerName];
				bestTotal = points;
			} else if (points == bestTotal) {
				bestPlayers.push(playerName);
			}
		}
		
		if (bestPlayers.length === 1) {
			this.writeConsole ("winner is " + bestPlayers[0]);
		} else {
			this.writeConsole ("winners are " + bestPlayers.join(" and "));
		}
		
		// now show the entire hand
		var me = this.getPlayer("me");
		console.log(me.statAllCards());
	}
	
	return gameOver;
};
