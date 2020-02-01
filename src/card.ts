export interface ICard {
	name: string;
    type: string;
    cost: number;

    // treasure only
    value?: number;

    // victory only
    points?: number;
};

export interface ITreasureCard extends ICard {
	value: number;
};

export interface IVictoryCard extends ICard {
    points: number;
}