const { PlayerStrategy } = require("../src/player-strategies");

class SimpleTestStrategy extends PlayerStrategy {
    actionTurn() {
        return null;
    }

    /**
     * @param {Player} player
     * @param {any} deck
     * @param {number} treasurePot
     */
    getBuyGoal(player, deck, treasurePot) {
        const money = player.getMoneyInHand() + treasurePot;
        // console.log(`${player.name} -> ${money} (${treasurePot})`);
        if (money >= 8 && deck.province > 0) {
            return "province";
        } else if (money >= 6 && deck.gold > 0) {
            return "gold";
        } else if (money >= 3 && deck.silver > 0) {
            return "silver";
        }
        return null;
    }
}

class DoNothingStrategy extends PlayerStrategy {
    actionTurn() {
        return null;
    }

    getBuyGoal() {
        return null;
    }
}

module.exports = {
    DoNothingStrategy,
    SimpleTestStrategy
};
