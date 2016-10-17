document.addEventListener('click', function(e) {
	var states = ['unset', 'one', 'two', 'three', 'all'];
	var classes = e.target.classList;
	states.some(function(state, i) {
		if (classes.contains(state)) {
			classes.remove(state);
			classes.add(states[(i + 1) % states.length]);
			return true;
		}
	});
}, false);