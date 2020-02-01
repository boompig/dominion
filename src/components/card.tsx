import React, {Component} from "react";
import { ICard } from "../card";


interface IHandCardProps {
	card: ICard;
	cardIndex: number;

	/* functions */
	onClick: any;
	getCardClasses: any;
};


export class HandCard extends Component<IHandCardProps, {}> {
	constructor(props: IHandCardProps) {
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


interface ISupplyCardProps {
	card: ICard;
	numRemaining: number;
	phase: string;
	isHumanPlayerTurn: boolean;

	/* functions */
	onClick: any;
	getCardClasses: any;
}


export class SupplyCard extends Component<ISupplyCardProps, {}> {
	constructor(props: ISupplyCardProps) {
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