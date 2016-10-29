function notifyMilestone(stage, i) {
	if (typeof webkitNotifications !== 'undefined') {
		// Note: There's no need to call webkitNotifications.checkPermission().
		// Extensions that declare the notifications permission are always
		// allowed create notifications.

		// Create a simple text notification:
		var notification = webkitNotifications.createNotification(
		  '../img/silk/award_star_gold_1.png',  // icon url - can be relative
		  'Hello!',  // notification title
		  'Lorem ipsum...'  // notification body text
		);

		// Or create an HTML notification:
		var notification = webkitNotifications.createHTMLNotification(
		  '../popup/popup.html'  // html url - can be relative
		);

		// Then show the notification.
		notification.show();
	} else {

		chrome.notifications.create({
		  type: "basic",
		  title: "Milestone Reached",
		  message: "Congratulations! You didn't orgasm for " + milestones.name(stage, i) + ". Keep up the good work!",
		  iconUrl: "../img/silk/award_star_gold_1.png",
		  eventTime: Date.now()
		}, function(){});
	}
}

var milestones = (function(s) {
	var s = [
		{ unit: 'second',  values: [30] },
		{ unit: 'minute',  values: [1, 5, 15, 30, 45] },
		{ unit: 'hour',  values: [1, 4, 8, 16] },
		{ unit: 'day',   values: [1, 2, 5, 10, 14, 21] },
		{ unit: 'day',   values: [30, 45, 60, 75, 90, 120, 180, 270] },
		{ unit: 'month', values: [12, 18, 24, 48, 87] },
		{ unit: 'year',  values: [10, 15, 20, 30, 40, 50, 75] },
		{ unit: 'year',  values: [100] },
		{ unit: 'year',  values: [200, 500] },
		{ unit: 'year',  values: [1000, Infinity] }
	];
	var props = {milli: 'Milliseconds', second: 'Seconds', minute: 'Minutes', hour: 'Hours', day: 'Date', month: 'Month', year: 'FullYear'};
	var currentStage; // index
	var nextMilestone; // timestamp
	return {
		init: function() {
			/*updateMilestone();
			initProgressBar(currentStage);
			updateProgressBar(currentStage);
			updateCountdown();*/
		},
		update: function() {
			var stage = currentStage;
			updateMilestone();
			if (stage !== currentStage) {
				initProgressBar(currentStage);
			}
			updateProgressBar(currentStage);
			updateCountdown();
			if (['second'].indexOf(s[currentStage].unit) >= 0) {
				// update every second
				scheduleUpdate(1000);
			} else if (['minute'].indexOf(s[currentStage].unit) >= 0) {
				// update every 10 seconds
				scheduleUpdate(10000);
			} else {
				// update every full minute
				scheduleUpdate((60 - new Date().getSeconds()) * 1000);
			}
		},
		name: function(stage, i) {
			while (s[stage].values.length <= i) {
				i -= s[stage].values.length;
				stage += 1;
			}
			return s[stage].values[i] + ' ' + s[stage].unit + (s[stage].values[i] === 1 ? '' : 's');
		}
	};
	function updateMilestone() {
		var ms = getNextMilestone();
		var timestamp = getMilestone(ms.stage, ms.i).getTime();
		if (timestamp > nextMilestone) {
			// reached a new ms
			notifyMilestone(ms.stage, ms.i - 1);
			if (ms.i === 1) {
				// reached new stage
			}
		}
		currentStage = ms.stage;
		nextMilestone = timestamp;
	}
	function getNextMilestone() {
		var now = Date.now();
		for (var stage = 0; stage < s.length; ++stage) {
			if (now < getMilestone(stage, s[stage].values.length).getTime()) {
				break;
			}
		}
		for (var i = 0; i <= s[stage].values.length; ++i) {
			if (now < getMilestone(stage, i).getTime()) {
				break;
			}
		}
		return {stage: stage, i: i};
	}
	function getMilestone(stage, i) {
		while (stage < s.length && s[stage].values.length <= i) {
			i -= s[stage].values.length;
			stage += 1;
		}
		if (s.length <= stage) {
			stage = s.length - 1;
			i = s[stage].length - 1;
		}
		var d = new Date(lastOrgasm ? lastOrgasm.time : installDate);
		add(d, s[stage].unit, s[stage].values[i]);
		return d;
	}
	function updateProgressBar(stage) {
		var values = [];
		if (!stage) {
			values.push(lastOrgasm ? lastOrgasm.time : installDate);
		}
		s[stage].values.forEach(function(value, i) {
			values.push(getMilestone(stage, i).getTime());
		});
		if (stage + 1 < s.length) {
			values.push(getMilestone(stage + 1, 0));
		}
		var minValue = values[0], maxValue = values[values.length - 1];
		$('.progress').each(function() {
			var $mss = $(this).find('.progress-wrapper > .progress-bar > .progress-mss-wrapper > .progress-mss > .progress-ms');
			var $curr = $(this).find('.progress-wrapper > .progress-bar > .progress-curr');
			if ($mss.length && $curr.length) {
				var currLeft = $curr.offset().left;
				var $firstMs = $mss.first();
				var $lastMs = $mss.last();

				var minPx = $firstMs.offset().left - currLeft;
				var maxPx = $lastMs.offset().left - currLeft;

				$curr.width((Date.now() - minValue) / (maxValue - minValue) * (maxPx - minPx) + minPx);
			}
		});
	}
	function initProgressBar(stage) {
		var labels, values = [];
		if (!stage) {
			values.push(lastOrgasm ? lastOrgasm.time : installDate);
		}
		s[stage].values.forEach(function(value, i) {
			values.push(getMilestone(stage, i).getTime());
		});
		if (stage + 1 < s.length) {
			values.push(getMilestone(stage + 1, 0));
		}
		labels = values.map(function(value) {
			return toUnit(value, s[stage].unit);
		});
		var minValue = values[0], maxValue = values[values.length - 1];
		$('.progress').each(function() {
			var $labels = $(this).find('.progress-toplabels > .progress-labels-wrapper > .progress-mslabel');
			var $mss = $(this).find('.progress-wrapper > .progress-bar > .progress-mss-wrapper > .progress-mss > .progress-ms');
			var $curr = $(this).find('.progress-wrapper > .progress-bar > .progress-curr');
			if ($mss.length && $labels.length && $curr.length) {
				var currLeft = $curr.offset().left;
				var $firstLabel = $labels.first();
				var $lastLabel = $labels.last();
				var $firstMs = $mss.first();
				var $lastMs = $mss.last();

				var minPx = $firstMs.offset().left - currLeft;
				var maxPx = $lastMs.offset().left - currLeft;

				$curr.width((Date.now() - minValue) / (maxValue - minValue) * (maxPx - minPx) + minPx);

				while (values.length > $labels.length) {
					var $label = $('<span class="progress-mslabel"></span>');
					$lastLabel.before($label);
					$labels = $labels.add($label);
				}
				while (values.length < $labels.length) {
					var $label = $labels.eq(-2);
					$label.remove();
					$labels = $labels.not($label);
				}
				while (values.length > $mss.length) {
					var $ms = $('<span class="progress-ms"></span>');
					$lastMs.before($ms);
					$mss = $mss.add($ms);
				}
				while (values.length < $mss.length) {
					var $ms = $mss.eq(-2);
					$ms.remove();
					$mss = $mss.not($ms);
				}
				$labels.each(function(i) {
					var $label = $(this);
					var $ms = $mss.eq(i);
					var left = (values[i] - minValue) / (maxValue - minValue) * (maxPx - minPx);// + minPx;
					$label.text(labels[i]);
					$ms.css('left', left);
					$label.css('left', left);
				});
			}
		});
	}
	function convertUnit(value, from, to) {
		if (from === to) {
			return value;
		}
		return toUnit(fromUnit(value, from), to);
	}
	function fromUnit(value, from) {
		var basis = lastOrgasm ? lastOrgasm.time : installDate;
		var d = new Date(basis);
		return add(d, from, value).getTime();
	}
	function toUnit(value, to) {
		var basis = lastOrgasm ? lastOrgasm.time : installDate;
		var d = new Date(value);
		var result = 0;
		while (d.getTime() > basis) {
			var x = 1; // pretty dumb
			result += x;
			add(d, to, -x);
		}
		return result;
	}
	function updateCountdown() {
		var d = nextMilestone - Date.now();
		var seconds = Math.round(d / 1000);

		// Round to full minutes
		if (seconds % 60 >= 30) {
			seconds += 60 - (seconds % 60);
		}

		var minutes = Math.floor(seconds / 60);
		var hours = Math.floor(minutes / 60);
		var days = Math.floor(hours / 24);
		$('#days').text(days < 100 ? ('00' + days).slice(-3) : days);
		$('#hours').text(('0' + (hours % 24)).slice(-2));
		$('#minutes').text(('0' + (minutes % 60)).slice(-2));
	}
	function get(date, unit) {
		return Date.prototype['get' + props[unit]].call(date);
	}
	function set(date, unit, value) {
		Date.prototype['set' + props[unit]].call(date, value);
	}
	function add(date, unit, value) {
		set(date, unit, get(date, unit) + value);
	}
}());