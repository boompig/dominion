function GameUI () {
	this.model = new Game();
}

GameUI.instance = null;

GameUI.getInstance = function () {
	if (GameUI.instance == null) {
		GameUI.instance = new GameUI();
	}
	
	return GameUI.instance;
};

GameUI.prototype.writeConsole = function (msg, player, v_level) {
	if (v_level == undefined) {
		v_level = 0;
	}
	
	if (v_level > Game.V_LEVEL) {
		return;
	}
	
	if (! player) {
		player = "game"
	}
	
	var msg = "[ " + player + " @ turn " + (this.model.turn + 1) + " ] : " + msg + "\n";
	
	$("#console").val(msg + $("#console").val());
};

GameUI.prototype.reset = function () {
	$(".card").remove();
	this.model = new Game();
};

GameUI.prototype.createUI = function () {
	var div, p;
	
	for (var i = 0; i < this.model.numPlayers; i++) {
		p = this.model.players[i];
		
		div = $(".hand.template").clone().removeClass("template").attr("id", "player" + i);
		
		$(div).append($("<h3>Hand for '" + p.name + "'</h1>"));
		
		$("#content").append(div);
	}
	
	for (var i = 0; i < this.model.numPlayers; i++) {
		this.updateHand(i);
	}
};

/**
 * Return true iff the game is over
 * @returns {Boolean}
 */
GameUI.prototype.doTurn = function () {
	this.model.changeTurn();
	
	$(".ui-selected").removeClass("ui-selected");
	$("#player" + this.model.playerIndex()).find("h3").addClass("ui-selected");
	
	var end = this.model.doTurn(this.model.currentPlayer());
	
	// update UI
	this.updateHand(this.model.playerIndex());
	
	return end;
};

/**
 * 
 * @param {Number} playerIndex
 * @param {Player} player
 */
GameUI.prototype.updateHand = function (playerIndex) {
	var div = $("#player" + playerIndex);
	var span, card;
	var player = this.model.players[playerIndex]
	
	$(div).find(".card").remove();
	
	for (var i = 0; i < player.hand.length; i++) {
		card = player.hand[i];
		
		span = $("<span><span>").addClass("card").html(card.name);
		$(span).addClass(card.type);
		$(span).addClass(card.name.replace(" ", "-"));
		
		$(div).append(span);
	}
};