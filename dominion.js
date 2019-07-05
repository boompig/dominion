/* global Vue */

import { Game } from "./game.js";

new Vue({
	el: "#app-container",
	data: {
		game: null,
		simMode: false,
	},
	methods: {
		doTurn: function() {
			this.game.doTurn();
		},
		doRound: function() {
			const round = this.game.round;
			while((this.game.round === round) && !this.game.gameOver) {
				this.game.doTurn();
			}
		},
		doSim: function() {
			this.simMode = true;
			while (!this.game.gameOver) {
				this.game.doTurn();
			}
			this.simMode = false;
		},
		resetSim: function () {
			this.simMode = false;
			this.game = new Game();
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
			return this.game.gameOver || this.simMode;
		}
	}
});