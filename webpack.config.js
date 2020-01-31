const path = require("path");

module.exports = {
	mode: "development",

	entry: "./src/main.jsx",

	output: {
		filename: "dominion.react.bundle.js",
		path: path.resolve("dist")
	},

	devtool: "source-map",

	resolve: {
		extensions: [".js", ".jsx"]
	},


	// devServer: {
	//   inline: true,
	//   port: 7777
	// },

	module: {
		rules: [
			{
				test: /\.jsx?$/,
				exclude: /node_modules/,
				loader: "babel-loader",
				// options: {
				// 	presets: ["es2015"]
				// }
			}
		]
	}
};
