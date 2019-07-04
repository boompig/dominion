/* global angular, Game */

angular.module("dominionApp", [])
	.controller("dominionCtrl", ($scope) => {
		$scope.game = null;

		$scope.simMode = false;

		$scope.doTurn = function() {
			$scope.game.doTurn();
		};

		/**
		 * Run until the end of this round
		 */
		$scope.doRound = function () {
			const round = $scope.game.round;
			while(($scope.game.round === round) && !$scope.game.gameOver) {
				$scope.game.doTurn();
			}
		};

		$scope.doSim = function () {
			$scope.simMode = true;
			while (!$scope.game.gameOver) {
				$scope.game.doTurn();
			}
			$scope.simMode = false;
		};

		$scope.resetSim = function () {
			$scope.simMode = false;
			$scope.game = new Game();
		};

		$scope.resetSim();
	});
