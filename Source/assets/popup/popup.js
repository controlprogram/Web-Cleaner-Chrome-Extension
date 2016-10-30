document.addEventListener('DOMContentLoaded', function() {
	var milestones = chrome.extension.getBackgroundPage().milestones;
	var stats = chrome.extension.getBackgroundPage().stats;
	document.getElementById('button-more').addEventListener('click', function() {
		chrome.extension.getBackgroundPage().openProgress();
	}, false);

	stats.listen(['milestone', 'cummed', 'milked', 'ruined'], displayEvents);
	addEventListener('unload', function() {
		stats.unlisten(['milestone', 'cummed', 'milked', 'ruined'], displayEvents);
	});

	displayEvents(stats.getEvents(['milestone', 'cummed', 'milked', 'ruined'], Date.now() - 60*1000));

	function displayEvents(events) {
		events.forEach(function(e) {
			if (e.type === 'milestone') {
				$('#container').append($('<div><div class="inline"><img src="../img/silk/award_star_bronze_2.png" align="top" /> <span class="duration">' + milestones.name(e.value.stage, e.value.index) + '</span> Achieved</div><div class="time inline"><span class="time">' + formatTime(e.time) + '</span></div></div>'));
			} else {
				$('#container').append($('<div><div class="inline"><img src="../img/silk/lock_break.png" align="top" /> You ' + e.type + '</div><div class="time inline"><span class="time">' + formatTime(e.time) + '</span></div></div>'));
			}
		});
	}

	function updateMS() {
		var msItem = document.getElementById('item-milestone');
		var msLabel = document.getElementById('milestone-text');
		var msTime = document.getElementById('milestone-time');
		var ms = milestones.getLast();
		console.log(ms);
		if (ms && Date.now() - ms.time < 24*60*60*1000) {
			msLabel.textContent = ms.name;
			msTime.textContent = formatTime(new Date(ms.time));
			msItem.style.display = 'block';
		} else {
			msItem.style.display = 'none';
		}


	}

		function formatTime(d) {
			d = new Date(d);
			var hours = d.getHours();
			var minutes = d.getMinutes();
			var ampm = 'AM';
			if (hours >= 12) {
				ampm = 'PM';
				hours -= 12;
			}
			if (hours === 0) {
				hours = 12;
			}
			return ('0' + hours).slice(-2) + ':' + ('0' + minutes).slice(-2) + ' ' + ampm;
		}
}, false);