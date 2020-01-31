const path = require("path");

module.exports = {
	mode: "development",

	entry: "./src/dominion.js",

	output: {
		filename: "dominion.bundle.js",
		path: path.resolve("dist")
	},

	devtool: "source-map",

	resolve: {
		extensions: [".js"]
	},


	// devServer: {
	//   inline: true,
	//   port: 7777
	// },

};