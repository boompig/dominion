/**
 * This file controls the in-browser visualization of a game of Dominion
 * The human player is always inserted as the first player
 */

/* global Vue, alert, window */
const Game = require("./game.js");

new Vue({
	el: "#app-container",
	data: {
		game: null,
		simMode: false,
		numCardsToTrash: 0,
		numCardsToDiscard: 0,

		// game parameters
		numPlayers: 4,
		humanPlayerIndex: 0,
		humanPlayerName: "Joe America",
	},
	methods: {
		doTurn: function() {
			if(this.game.turn === this.humanPlayerIndex) {
				throw new Error("cannot automate human turn");
			} else {
				this.game.doTurn();
			}
		},
		doRound: function() {
			const round = this.game.round;
			while((this.game.round === round) && !this.game.gameOver &&
				(this.game.turn !== this.humanPlayerIndex)) {
				this.game.doTurn();
			}
		},
		/*
		doSim: function() {
			this.simMode = true;
			while (!this.game.gameOver) {
				this.game.doTurn();
			}
			this.simMode = false;
		},
		*/
		resetSim: function () {
			this.simMode = false;
			this.game = new Game({
				humanPlayerIndex: this.humanPlayerIndex,
				humanPlayerName: this.humanPlayerName,
				numPlayers: this.numPlayers
			});
			this.numCardsToTrash = 0;
			this.numCardsToDiscard = 0;
		},

		/*** human player functions start here ****/
		drawCard: function() {
			if(this.game.turn !== this.humanPlayerIndex) {
				throw new Error("can only draw on your turn");
			}
			if(this.game.phase !== "draw") {
				throw new Error("cannot draw card outside of draw phase using this method");
			}

			this.game.drawPhase();
		},

		endActionPhase: function() {
			if(this.game.turn !== this.humanPlayerIndex) {
				throw new Error("can only end action phase on your turn");
			}
			if(this.game.phase !== "action") {
				throw new Error("cannot end action phase outside of action phase using this method");
			}

			this.game.endActionPhase();
		},

		clickHandCard(player, playerIndex, card, cardIndex) {
			if(playerIndex !== this.humanPlayerIndex) {
				// throw new Error("can only play cards on behalf of human player");
				console.warn("can only play cards on behalf of human player");
				return;
			}

			if (this.game.turn !== this.humanPlayerIndex) {
				console.warn("can only play cards on your turn");
				return;
			}

			if (this.game.phase === "trash") {
				console.debug(`Trying to trash card ${card.name}...`);
				this.trashCard(card, cardIndex);
			} else if (this.game.phase === "discard") {
				console.debug(`Trying to discard card ${card.name}...`);
				this.discardCard(card, cardIndex);
			} else if (card.type === "treasure") {
				try {
					return this.game.playTreasureCard(cardIndex);
				} catch (e) {
					console.error(e);
					alert(e.message);
					return;
				}
			} else if (card.type === "action") {
				try {
					this.game.playActionCard(player, playerIndex, card);
					if (this.game.phase === "trash") {
						this.numCardsToTrash = this.game.numTrash;
					} else if (this.game.phase === "discard") {
						this.numCardsToDiscard = this.game.numDiscard;
					}
				} catch (e) {
					console.error(e);
					alert(e.message);
					return;
				}
			} else {
				throw new Error(`Unsupported card type: ${card.type}`)
			}
		},

		clickSupplyCard: function(cardName) {
			if (this.game.turn !== this.humanPlayerIndex) {
				console.warn("can only buy on your turn");
				return;
			}
			if(this.game.phase !== "buy" && this.game.phase !== "gain") {
				console.warn("cannot buy/gain card outside buy/gain phase using this method");
			}
			if(this.game.phase === "buy") {
				try {
					this.game.buyCard(cardName, this.humanPlayerIndex);
					return true;
				} catch (e) {
					alert(e.message);
					return false;
				}
			} else if(this.game.phase === "gain") {
				try {
					this.game.gainCard(cardName, this.humanPlayerIndex);
					return true;
				} catch (e) {
					alert(e.message);
					return false;
				}
			}
		},

		trashCard: function(card, cardIndex) {
			if (this.numCardsToTrash === 0) {
				throw new Error("Cannot trash cards right now");
			}
			const player = this.game.players[this.game.turn];
			this.game.trashCards(player, [cardIndex]);
			this.numCardsToTrash--;
		},

		discardCard: function(card, cardIndex) {
			if (this.numCardsToDiscard === 0) {
				throw new Error("Cannot discard cards right now");
			}
			const player = this.game.players[this.game.turn];
			this.game.discardCards(player, [cardIndex]);
			this.numCardsToDiscard--;
		},

		stopTrashingCards: function() {
			this.numCardsToTrash = 0;
		},

		stopDiscardingCards: function() {
			this.numCardsToDiscard = 0;
		},

		endHumanPlayerTurn: function() {
			if (this.game.turn !== this.humanPlayerIndex) {
				console.warn("can only end turn on your turn");
				return;
			}
			if(this.game.phase !== "buy") {
				console.warn(`cannot end turn in ${this.game.phase} phase`);
			}
			this.game.endTurn();
		},
	},
	beforeMount: function () {
		console.log("beforeMount");
		// grab the name, if set, from URL params
		const url = new URL(window.location.href);
		if(url.searchParams.get("name")) {
			this.humanPlayerName = url.searchParams.get("name");
		}
		this.resetSim();
	},
	computed: {
		cardClasses: function() {
			/**
			 * @param {Card | string} card can be either a string or Card object
			 * @param {string} source - either "hand" or "deck"
			 */
			return (card, source) => {
				const classes = {
					"card": true
				};
				if(typeof card === "string") {
					card = this.game.cards[card];
				}
				if(card) {
					classes[card.type] = true;
					classes[card.name] = true;
				}

				if(source === "hand" && card.type === "action") {
					classes["active"] = (this.game.turn === this.humanPlayerIndex) && this.game.phase === "action";
				} else if(source === "deck" || card.type === "treasure") {
					classes["active"] = (this.game.turn === this.humanPlayerIndex && this.game.phase === "buy");
				}

				return classes;
			};
		},

		/**
		 * for AI buttons
		 */
		buttonDisabled: function() {
			return this.game.gameOver || this.simMode || (this.game.turn === this.humanPlayerIndex);
		},
		standardSupplyCards: function() {
			return Object.keys(this.game.supply).filter((cardName) => {
				return this.game.cards[cardName].type !== "action";
			});
		},
		kingdomSupplyCards: function() {
			return Object.keys(this.game.supply).filter((cardName) => {
				return this.game.cards[cardName].type === "action";
			});
		},
		isHumanPlayerTurn: function() {
			return this.game.turn === this.humanPlayerIndex;
		}
	}
});