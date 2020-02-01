module.exports = {
	"env": {
		"node": true,
		"es6": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:jest/recommended",
		"plugin:react/recommended",
		"plugin:@typescript-eslint/recommended"
	],
	"parser": "@typescript-eslint/parser",
	"plugins": ["jest", "@typescript-eslint"],
	"globals": {
		"Atomics": "readonly",
		"SharedArrayBuffer": "readonly"
	},
	"parserOptions": {
		"ecmaVersion": 2018,
		"sourceType": "module"
	},
	"rules": {
		"indent": [
			"error",
			"tab"
		],
		"linebreak-style": [
			"error",
			"unix"
		],
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		],
		"no-console": 0,
		"curly": ["error"],
		"@typescript-eslint/interface-name-prefix": [
			"error",
			"always"
		]
	}
};