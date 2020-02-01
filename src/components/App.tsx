import React, {Component} from "react";
import { Game } from "../game";
import GameOver from "./game-over";
import Supply from "./supply";
import InfoPane from "./info-pane";
import PlayerContainer from "./player-container";
import ButtonContainer from "./button-container";
import Player from "../player";
import {ICard} from "../card";


interface IAppProps {};
interface IAppState {
	game: Game | null;
	isGameLoaded: boolean;
	simMode: boolean;

	// game params
	numPlayers: number;
	humanPlayerIndex: number;
	humanPlayerName: string;

	numCardsToTrash: number;
	numCardsToDiscard: number;
};


class App extends Component<{}, IAppState> {
	constructor(props: IAppProps) {
		super(props);

		this.state = {
			game: null,
			isGameLoaded: false,
			simMode: false,

			numCardsToTrash: 0,
			numCardsToDiscard: 0,

			// game parameters
			numPlayers: 4,
			humanPlayerIndex: 0,
			humanPlayerName: "Joe America"
		};

		this.onClickSupplyCard = this.onClickSupplyCard.bind(this);
		this.onClickHandCard = this.onClickHandCard.bind(this);
		this.getCardClasses = this.getCardClasses.bind(this);

		this.doTurn = this.doTurn.bind(this);
		this.doRound = this.doRound.bind(this);
		this.resetSim = this.resetSim.bind(this);

		this.drawCard = this.drawCard.bind(this);
		this.endActionPhase = this.endActionPhase.bind(this);
		this.endHumanPlayerTurn = this.endHumanPlayerTurn.bind(this);
		this.stopTrashingCards = this.stopTrashingCards.bind(this);
		this.stopDiscardingCards = this.stopDiscardingCards.bind(this);
		this.trashCard = this.trashCard.bind(this);
	}

	doTurn() {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		if (this.state.game.turn === this.state.humanPlayerIndex) {
			throw new Error("cannot automate human turn");
		} else {
			this.state.game.doTurn();

			// hard reset game
			this.setState({
				game: this.state.game
			});
		}
	}

	doRound() {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		const round = this.state.game.round;
		while ((this.state.game.round === round) && !this.state.game.isGameOver &&
			(this.state.game.turn !== this.state.humanPlayerIndex)) {
			this.state.game.doTurn();

		}

		// hard reset game
		this.setState({
			game: this.state.game
		});
	}

	resetSim() {
		const game = new Game({
			humanPlayerIndex: this.state.humanPlayerIndex,
			humanPlayerName: this.state.humanPlayerName,
			numPlayers: this.state.numPlayers
		});

		this.setState({
			simMode: false,
			game: game,
			numCardsToTrash: 0,
			numCardsToDiscard: 0,
			isGameLoaded: true,
		});
	}

	drawCard() {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		if(this.state.game.turn !== this.state.humanPlayerIndex) {
			throw new Error("can only draw on your turn");
		}
		if(this.state.game.phase !== "draw") {
			throw new Error(`cannot draw card outside of draw phase using this method - phase ${this.state.game.phase}`);
		}

		this.state.game.drawPhase();

		// hard reset game
		this.setState({
			game: this.state.game
		});
	}

	endActionPhase() {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		if(this.state.game.turn !== this.state.humanPlayerIndex) {
			throw new Error("can only end action phase on your turn");
		}
		if(this.state.game.phase !== "action") {
			throw new Error("cannot end action phase outside of action phase using this method");
		}

		this.state.game.endActionPhase();

		// hard reset game
		this.setState({
			game: this.state.game
		});
	}

	trashCard(card: ICard, cardIndex: number) {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		if (this.state.numCardsToTrash === 0) {
			throw new Error("Cannot trash cards right now");
		}
		const player = this.state.game.players[this.state.game.turn];
		this.state.game.trashCards(player, [cardIndex], false);

		// hard reset game
		this.setState({
			game: this.state.game,
			numCardsToTrash: this.state.numCardsToTrash - 1
		});
	}

	discardCard(card: ICard, cardIndex: number) {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		if (this.state.numCardsToDiscard === 0) {
			throw new Error("Cannot discard cards right now");
		}

		const player = this.state.game.players[this.state.game.turn];
		this.state.game.discardCards(player, [cardIndex]);

		// hard reset game
		this.setState({
			game: this.state.game,
			numCardsToDiscard: this.state.numCardsToDiscard - 1
		});
	}

	componentDidMount() {
		// grab the name, if set, from URL params
		const url = new URL(window.location.href);
		let name = url.searchParams.get("name");
		if(name) {
			this.setState({
				humanPlayerName: name
			}, () => {
				this.resetSim();
			});
		} else {
			window.location.href = "/";
		}
	}

	onClickSupplyCard(cardName: string) {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		if (this.state.game.turn !== this.state.humanPlayerIndex) {
			console.warn("can only buy on your turn");
			return;
		}
		if(this.state.game.phase !== "buy" && this.state.game.phase !== "gain") {
			console.warn(`cannot buy/gain card outside buy/gain phase using this method - phase was ${this.state.game.phase}`);
			return;
		}

		if(this.state.game.phase === "buy") {
			try {
				this.state.game.buyCard(cardName, this.state.humanPlayerIndex);
			} catch (e) {
				window.alert(e.message);
				return false;
			}
		} else if(this.state.game.phase === "gain") {
			try {
				this.state.game.gainCardWithCheck(cardName, this.state.humanPlayerIndex);
			} catch (e) {
				window.alert(e.message);
				return false;
			}
		}

		// hard reset game
		this.setState({
			game: this.state.game
		});
		return true;
	}

	onClickHandCard(player: Player, playerIndex: number, card: ICard, cardIndex: number) {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		if (playerIndex !== this.state.humanPlayerIndex) {
			console.warn("can only play cards on behalf of human player");
			return;
		}

		if (this.state.game.turn !== this.state.humanPlayerIndex) {
			console.warn("can only play cards on your turn");
			return;
		}

		if(!card) {
			console.warn("Card is undefined");
			return;
		}

		let numCardsToTrash = this.state.numCardsToTrash;
		let numCardsToDiscard = this.state.numCardsToDiscard;

		if (this.state.game.phase === "trash") {
			console.debug(`Trying to trash card ${card.name}...`);
			this.trashCard(card, cardIndex);
		} else if (this.state.game.phase === "discard") {
			console.debug(`Trying to discard card ${card.name}...`);
			this.discardCard(card, cardIndex);
		} else if (card.type === "treasure") {
			try {
				this.state.game.playTreasureCard(cardIndex);
			} catch (e) {
				console.error(e);
				window.alert(e.message);
				return;
			}
		} else if (card.type === "action") {
			try {
				this.state.game.playActionCard(player, playerIndex, card);
				if (this.state.game.phase === "trash") {
					numCardsToTrash = this.state.game.numTrash;
				} else if (this.state.game.phase === "discard") {
					numCardsToDiscard = this.state.game.numDiscard;
				}
			} catch (e) {
				console.error(e);
				window.alert(e.message);
				return;
			}
		} else {
			throw new Error(`Unsupported card type: ${card.type}`);
		}

		// hard reset game
		this.setState({
			game: this.state.game,
			numCardsToTrash: numCardsToTrash,
			numCardsToDiscard: numCardsToDiscard,
		});
	}

	/**
	 * @param {Card} card can be either a string or Card object
	 * @param {string} source - either "hand" or "supply"
	 * @returns {string[]}
	 */
	getCardClasses(card: ICard, source: string): string[] {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		const classes = [
			"card",
		];
		if(source === "supply") {
			classes.push("supply-card");
		} else if(source === "hand") {
			classes.push("player-card");
		}

		classes.push(card.type);
		classes.push(card.name);
		let isHumanPlayerTurn = (this.state.game.turn === this.state.humanPlayerIndex);

		if(source === "hand" && card.type === "action") {
			if(isHumanPlayerTurn && this.state.game.phase === "action") {
				classes.push("active");
			}
		} else if(source === "supply" || card.type === "treasure") {
			if(isHumanPlayerTurn && this.state.game.phase === "buy") {
				classes.push("active");
			}
		}

		return classes;
	}

	endHumanPlayerTurn() {
		if(!this.state.game) {
			throw new Error("game not created");
		}

		if (this.state.game.turn !== this.state.humanPlayerIndex) {
			console.warn("can only end turn on your turn");
			return;
		}

		if(this.state.game.phase !== "buy") {
			console.warn(`cannot end turn in ${this.state.game.phase} phase`);
			return;
		}

		this.state.game.endTurn();

		// hard reset game
		this.setState({
			game: this.state.game
		});
	}

	stopTrashingCards() {
		this.setState({
			numCardsToTrash: 0
		});
	}

	stopDiscardingCards() {
		this.setState({
			numCardsToDiscard: 0
		});
	}

	render() {
		if(this.state.isGameLoaded && this.state.game) {
			if(!this.state.game) {
				throw new Error("game not loaded");
			}
			let playerContainers = this.state.game.players.map((player, index) => {
				return <PlayerContainer
					player={player}
					playerIndex={index}
					turn={(this.state.game as Game).turn}
					getCardClasses={this.getCardClasses}
					key={player.name}
					onClick={this.onClickHandCard} />;
			});

			return (
				<div id="app-container" className="container container-fluid">
					<h1 className="title">Dominion Simulation - Round { this.state.game.round }</h1>
					{this.state.game.isGameOver ?
						<GameOver winArr={this.state.game.winArr} /> :
						null}

					<div className="sim-container">
						<div className="supply-outer-container">
							<h5>Supply</h5>
							<Supply
								supply={this.state.game.supply}
								phase={this.state.game.phase}
								cards={this.state.game.cards}
								isHumanPlayerTurn={this.state.game.turn === this.state.humanPlayerIndex}
								onClick={this.onClickSupplyCard}
								getCardClasses={this.getCardClasses}
							/>
						</div>

						<InfoPane
							game={this.state.game}
							numCardsToDiscard={this.state.numCardsToDiscard}
							numCardsToTrash={this.state.numCardsToTrash}
							humanPlayerIndex={this.state.humanPlayerIndex}
						/>

						<div className="player-container">
							{ playerContainers }
						</div>
					</div>

					<ButtonContainer
						game={this.state.game}
						isHumanPlayerTurn={this.state.game.turn === this.state.humanPlayerIndex}
						numCardsToTrash={this.state.numCardsToTrash}
						numCardsToDiscard={this.state.numCardsToDiscard}
						simMode={this.state.simMode}
						drawCard={this.drawCard}
						endActionPhase={this.endActionPhase}
						endHumanPlayerTurn={this.endHumanPlayerTurn}
						stopTrashingCards={this.stopTrashingCards}
						stopDiscardingCards={this.stopDiscardingCards}
						doTurn={this.doTurn}
						doRound={this.doRound}
						resetSim={this.resetSim} />
				</div>
			);
		} else {
			return <div>Loading...</div>;
		}
	}
}

export default App;