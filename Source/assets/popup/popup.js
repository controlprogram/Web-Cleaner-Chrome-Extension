document.addEventListener('DOMContentLoaded', function() {
	document.getElementById('button-more').addEventListener('click', function() {
		chrome.extension.getBackgroundPage().openProgress();
	}, false);
}, false);