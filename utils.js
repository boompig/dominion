/* eslint-env node */

/**
 * @param {Game} game
 */
module.exports.printWinners = (game) => {
	const l = game.players.sort((p1, p2) => {
		p2.points - p1.points;
	});
	for(let i = 0; i < l.length; i++) {
		let p = l[i];
		console.log(`${i + 1}. ${p.name} -> ${p.points}`);
	}
};

/**
 * Print results with best strategies first
 * @param {results} Map from player name to how often they won
 */
module.exports.printResults = (results) => {
	const l = Object.keys(results).map((name) => {
		return [name, results[name]];
	});
	// order array based on higher scores first
	l.sort((a, b) => {
		return b[1] - a[1];
	});

	for(let i = 0; i < l.length; i++) {
		let playerName = l[i][0];
		let freq = l[i][1];
		console.log(`${i + 1}. ${playerName} -> ${freq}`);
	}
};