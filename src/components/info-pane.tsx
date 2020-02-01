import React, {Component} from "react";
import { Game } from "../game";


interface IInfoPaneProps {
	game: Game;
	numCardsToTrash: number;
	numCardsToDiscard: number;
	humanPlayerIndex: number;
}


export default class InfoPane extends Component<IInfoPaneProps, {}> {
	render() {
		let activeElems = null;
		if(this.props.game.turn === this.props.humanPlayerIndex) {
			activeElems = (<div>
				<div># buys: { this.props.game.players[this.props.game.turn].numBuys }</div>
				<div># actions: { this.props.game.players[this.props.game.turn].numActions }</div>
			</div>);
		}
		return (
			<div className="info-container">
				<div>Phase: { this.props.game.phase }</div>
				<div>Treasure Pot: { this.props.game.treasurePot }</div>
				{ activeElems }

				{this.props.numCardsToTrash > 0 ?
					<div className="num-trash-cards"># cards to trash: { this.props.numCardsToTrash }</div>:
					null
				}

				{this.props.numCardsToDiscard > 0 ?
					<div className="num-discard-cards"># cards to discard: { this.props.numCardsToDiscard }</div>:
					null
				}

				{this.props.game.numGain > 0 ?
					<div className="num-gain-cards"># cards to gain: { this.props.game.numGain }</div>:
					null
				}
			</div>
		);
	}
}