/* eslint react/prop-types: 0 */

import React from "react";

/**
 * props:
 *
 * - card: Card
 * - cardIndex: number
 * - getCardClasses: function
 * - onClick: function
 */
export class HandCard extends React.Component {
	constructor(props) {
		super(props);

		this.clickCard = this.clickCard.bind(this);
	}

	clickCard() {
		this.props.onClick(this.props.card, this.props.cardIndex);
	}

	render() {
		let classes = this.props.getCardClasses(this.props.card, "hand");
		return <div className={ classes.join(" ") } onClick={this.clickCard}>
			<div className="card-name">{ this.props.card.name }</div>
		</div>;
	}
}

/**
 * props:
 *
 * - card: Card
 * - numRemaining: number
 * - phase: string
 * - onClick: function
 * - getCardClasses: function
 */
export class SupplyCard extends React.Component {
	constructor(props) {
		super(props);

		this.clickSupplyCard = this.clickSupplyCard.bind(this);
	}

	clickSupplyCard() {
		this.props.onClick(this.props.card.name, "supply");
	}

	render() {
		let classes = this.props.getCardClasses(this.props.card, "supply");
		return (
			<div className={ classes.join(" ") } onClick={ this.clickSupplyCard }>
				{ this.props.card.name } ({ this.props.card.cost }) - { this.props.numRemaining } left
			</div>
		);
	}
}