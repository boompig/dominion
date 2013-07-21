/**
 * Taken from here
 * http://stackoverflow.com/a/2450976/755934
 * 
 * Return altered, shuffled array.
 * 
 * @param {Array} array
 */
function shuffle(array) {
	// console.log(array);
	
  	var tmp;
    var randomIndex;

	// While there remain elements to shuffle...
	for (var currentIndex = array.length - 1; currentIndex >= 0; currentIndex--) {
    	// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex + 1);

		// console.log("swap " + currentIndex + " and " + randomIndex);
		// And swap it with the current element.
	    tmp = array[currentIndex];
	    array[currentIndex] = array[randomIndex];
	    array[randomIndex] = tmp;
	}
}
