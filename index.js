/* eslint-env node */

const { Game } = require("./game");
const flags = require("flags");
const utils = require("./utils");

flags.defineNumber(
	"num-games",
	5,
	"Number of games to run"
);

flags.defineNumber(
	"num-players",
	5,
	"Number of players per game"
);

flags.parse();

const numGames = flags.get("num-games");
const numPlayers = flags.get("num-players");
const results = {};

for(let i = 0; i < numGames; i++) {
	const game = new Game({
		numPlayers: numPlayers
	});
	game.playGame();
	for(let p of game.winArr) {
		if(!(p.name in results)) {
			results[p.name] = 0;
		}
		results[p.name]++;
	}
}

utils.printResults(results);
