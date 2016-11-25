var states = ['unset', 'one', 'two', 'three', 'all'];
var progress;
var nodes;

document.addEventListener('DOMContentLoaded', init, false);

function init() {
	nodes = [].slice.call(document.querySelectorAll(states.map(function(state) {
		return '#daygrid .' + state;
	}).join(',')));
	nodes.forEach(function(node) {
		node.addEventListener('click', click, false);
	});
	load();
}

function click(e) {
	var node = e.currentTarget;
	var index = nodes.indexOf(node);
	node.classList.remove(states[progress[index]]);
	progress[index] = (progress[index] + 1) % states.length;
	node.classList.add(states[progress[index]]);
	save();
}

function load() {
	progress = null;
	try {
		progress = JSON.parse(localStorage.getItem('progressStates'));
	} catch (e) {}
	if (!(progress instanceof Array)) {
		progress = nodes.map(function(node) {
			for (var i = 0; i < states.length; ++i) {
				if (node.classList.contains(states[i])) {
					return i;
				}
			}
		});
	} else {
		display();
	}
}

function save() {
	localStorage.setItem('progressStates', JSON.stringify(progress));
}

function display() {
	nodes.forEach(function(node, i) {
		node.classList.remove.apply(node.classList, states);
		node.classList.add(states[progress[i]]);
	});
}