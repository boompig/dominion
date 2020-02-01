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
		extensions: [".js", ".jsx", ".ts", ".tsx"]
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
			},
			{
				test: /.tsx?$/,
				exclude: /node_modules/,
				loader: "ts-loader"
			}
		]
	}
};
