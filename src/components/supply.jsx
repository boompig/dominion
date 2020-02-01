/* eslint react/prop-types: 0 */

import React from "react";
import { SupplyCard } from "./card";

/**
 * props:
 *
 * - isHumanPlayerTurn: boolean
 * - phase: string
 * - supply: object - Map<string, number>
 * - cards: object - Map<string, Card>
 * - onClick: function
 * - getCardClasses: function
 */
export default class Supply extends React.Component {

	render() {
		const classes = ["supply-container"];
		if(this.props.isHumanPlayerTurn && this.props.phase === "buy") {
			classes.push("active");
		}

		let standardSupplyCards = [];
		let kingdomSupplyCards = [];
		for(let [cardName, numRemaining] of Object.entries(this.props.supply)) {
			let card = this.props.cards[cardName];
			if(!card) {
				throw new Error("cannot find card with name " + cardName);
			}
			let elem = <SupplyCard
				card={card}
				numRemaining={numRemaining}
				isHumanPlayerTurn={this.props.isHumanPlayerTurn}
				phase={this.props.phase}
				key={cardName}
				onClick={this.props.onClick}
				getCardClasses={this.props.getCardClasses}
			/>;
			if(card.type === "action") {
				kingdomSupplyCards.push(elem);
			} else {
				standardSupplyCards.push(elem);
			}
		};

		return (
			<div className={ classes.join(" ") }>
				<div className="supply-inner-container">
					{ standardSupplyCards }
				</div>
				<div className="supply-inner-container">
					{ kingdomSupplyCards }
				</div>
			</div>
		);
	}
}