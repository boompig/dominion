/**
 * This file controls the in-browser visualization of a game of Dominion
 * The human player is always inserted as the first player
 */

/* global Vue */

import { Game } from "./game.js";

new Vue({
	el: "#app-container",
	data: {
		game: null,
		simMode: false,

		// game parameters
		numPlayers: 4,
		// TODO
		humanPlayerIndex: -1,
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
				// humanPlayerIndex: this.humanPlayerIndex,
				// humanPlayerName: this.humanPlayerName,
				numPlayers: this.numPlayers
			});
		},
	},
	beforeMount: function () {
		console.log("beforeMount");
		this.resetSim();
	},
	computed: {
		cardClasses: function() {
			return card => {
				const classes = {
					"card": true
				};
				if(card) {
					classes[card.type] = true;
					classes[card.name] = true;
				}
				return classes;
			};
		},
		buttonDisabled: function() {
			return this.game.gameOver || this.simMode || (this.game.turn === this.humanPlayerIndex);
		},
		standardDeckCards: function() {
			return Object.keys(this.game.deck).filter((cardName) => {
				return this.game.cards[cardName].type !== "action";
			});
		},
		kingdomDeckCards: function() {
			return Object.keys(this.game.deck).filter((cardName) => {
				return this.game.cards[cardName].type === "action";
			});
		}
	}
});