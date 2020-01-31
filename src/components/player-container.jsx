/* eslint react/prop-types: 0 */

import React from "react";
import { HandCard } from "./card";

/**
 * props:
 *
 * - player: Player
 * - playerIndex: number
 * - getCardClasses: function
 * - onClick: function
 * - turn: number
 */
export default class PlayerContainer extends React.Component {
	constructor(props) {
		super(props);

		this.clickCard = this.clickCard.bind(this);
	}

	/**
	 * @param {Card} card
	 * @param {number} cardIndex
	 */
	clickCard(card, cardIndex) {
		this.props.onClick(
			this.props.player,
			this.props.playerIndex,
			card,
			cardIndex
		);
	}

	render() {
		let cardElems = this.props.player.hand.map((card, index) => {
			return <HandCard
				card={card}
				cardIndex={index}
				key={index}
				getCardClasses={this.props.getCardClasses}
				onClick={this.clickCard} />;
		});

		let classes = ["player"];
		if(this.props.turn === this.props.playerIndex) {
			classes.push("active");
		}

		return (<div className={ classes.join(" ") }>
			<div className="player-name">{ this.props.player.name } ({ this.props.player.isHuman ? "Human" : "AI" })</div>
			<div>Discard size: <span>{ this.props.player.discard.length }</span></div>
			<div>Points: <span>{ this.props.player.points }</span></div>

			{ cardElems }
		</div>);
	}
}