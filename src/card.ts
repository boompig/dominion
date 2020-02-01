export interface ICard {
	name: string;
    type: string;
    cost: number;

    // treasure only
    value?: number;

    // victory only
    points?: number;
    pointsEffect?: any;

    // action only
    effect?: any;
    isAttack?: boolean;
    isReaction?: boolean;
}

export interface ITreasureCard extends ICard {
    value: number;
}

export interface IVictoryCard extends ICard {
    points: number;
    pointsEffect?: any; // function
}

export interface IActionCard extends ICard {
    effect: any; //function
    isAttack: boolean;
    isReaction: boolean;
}