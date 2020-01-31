/* eslint react/prop-types: 0 */

import React from "react";

/**
 * props:
 *
 * - game: Game
 * - numCardsToTrash: number
 * - numCardsToDiscard: number
 * - isHumanPlayerTurn: boolean
 * - simMode: boolean
 *
 * - drawCard: function
 * - endActionPhase: function
 * - endHumanPlayerTurn: function
 * - stopTrashingCards: function
 * - stopDiscardingCards: function
 *
 * - doTurn: function
 * - doRound: function
 * - resetSim: function
 */
export default class ButtonContainer extends React.Component {
	constructor(props) {
		super(props);

		this.isButtonDisabled = this.isButtonDisabled.bind(this);
	}

	isButtonDisabled() {
		return this.props.game.isGameOver || this.props.simMode || this.props.isHumanPlayerTurn;
	}

	render() {
		return (<div id="btn-container">
			{/* buttons for human player */}
			{this.props.game.phase === "draw" && this.props.isHumanPlayerTurn ?
				<button className="btn btn-info" type="button" onClick={this.props.drawCard}
				>Draw Card</button> :
				null
			}

			{this.props.numCardsToTrash > 0 && this.props.isHumanPlayerTurn ?
				<button className="btn btn-info" type="button" onClick={this.props.stopTrashingCards}
				>Stop Trashing Cards</button> :
				null
			}

			{this.props.numCardsToDiscard > 0 && this.props.isHumanPlayerTurn ?
				<button className="btn btn-info" type="button" onClick={this.props.stopDiscardingCards}
				>Stop Discarding Cards</button> :
				null
			}

			{this.props.game.phase === "action" && this.props.isHumanPlayerTurn ?
				<button className="btn btn-info" type="button" onClick={this.props.endActionPhase}
				>End Action Phase</button> :
				null
			}

			{this.props.game.phase === "buy" && this.props.isHumanPlayerTurn ?
				<button className="btn btn-info" type="button" onClick={this.props.endHumanPlayerTurn}
				>End Turn</button> :
				null
			}

			{/* <!-- buttons for simulation --> */}
			<button className="btn btn-primary" type="button" onClick={this.props.doTurn}
				disabled={this.isButtonDisabled()}>AI Turn</button>

			<button className="btn btn-primary" type="button" onClick={this.props.doRound}
				disabled={this.isButtonDisabled()}>Run Simulation (1 Round)</button>

			{/* // <!-- <button className="btn btn-primary" type="button" v-on:click="doSim()" :disabled="buttonDisabled">Run Simulation (Full Game)</button> --> */}

			<button className="btn btn-danger" type="button" onClick={this.props.resetSim}
				disabled={this.props.simMode}>Reset</button>
		</div>);
	}
}
