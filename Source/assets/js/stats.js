var stats = chrome.extension.getBackgroundPage().stats;
var weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var startPeriod = new Date(), endPeriod = new Date();
startPeriod.setMonth(startPeriod.getMonth() - 1);
endPeriod.setMonth(endPeriod.getMonth() + 1);

var orgasms = stats.getEvents(['cummed', 'milked', 'ruined'], startPeriod.getTime(), endPeriod.getTime());
var cums = orgasms.filter(orgasm => orgasm.type === 'cummed');
var milks = orgasms.filter(orgasm => orgasm.type === 'milked');
var ruins = orgasms.filter(orgasm => orgasm.type === 'ruined');
var lastOrgasm = null, edgesSince, longestStreak, frequentRelapse, relapseDays;

var feelings = {
	happy: {title: 'Happy'},
	unhappy: {title: 'Unhappy'},
	shocked: {title: 'Shocked'},
	angry: {title: 'Angry'},
	upset: {title: 'Upset'},
	unsure: {title: 'Unsure'},
	stressed: {title: 'Stressed'},
	frustrated: {title: 'Frustrated'},
	turnedOn: {title: 'Turned On'},
	addicted: {title: 'Addicted'},
	bored: {title: 'Bored'},
	hero: {title: 'I can do it!'}
};

function today() {
	var today = new Date();
	// Today starts between 2am and 6am.
	if (today.getHours() < 2) {
		today.setDate(today.getDate() - 1);
	}
	today.setHours(6);
	today.setMinutes(0);
	today.setSeconds(0);
	return today;
}

var questions = {
	'cpr': {
		before: function() {
			return !stats.getEvents(['cummed', 'milked', 'ruined'], today().getTime()).length;
		},
		question: 'Have you needed CPR today?',
		answers: {
			cummed: 'Cummed',
			milked: 'Prostate Milked',
			ruined: 'Ruined',
			no: 'No'
		},
		values: function() {
			return [cums.length, milks.length, ruins.length, 0];
		},
		after: function(answer) {
			if (answer !== 'no') {
				stats.addEvent(answer);
			}
		}
	},
	'feel': {
		after: function(answer) {
			stats.addEvent('feeled', Date.now(), answer);
		}
	},
	'peoply-nearby': {
		question: 'How many people are near you?',
		color: 'gray',
		answers: {
			0: '0',
			1: '1-2',
			3: '3-5',
			6: '6+'
		}
	},
	'watched-porn': 'Have you looked at porn recently?',
	'touched': 'Have you touched yourself recently?',
	'masturbated': 'Have you masturbated recently?',
	'desperate': 'Are you desperate to cum?',
	'slept-well': {
		question: 'How well did you sleep?',
		color: 'purple',
		answers: {
			ok: 'OK',
			great: 'Great',
			poorly: 'Poorly'
		}
	}
};

function makeQuestion(id) {
	var question, answers;
	if (typeof questions[id] === 'string') {
		questions[id] = {question: questions[id]};
	}
	if (questions[id].html) {
		return $(questions[id].html);
	}
	question = questions[id].question;
	if (questions[id].answers) {
		if (Array.isArray(questions[id].answers)) {
			answers = {};
			questions[id].answers.forEach(answer => answers[answer.toLowerCase()]);
			questions[id].answers = answers;
		} else {
			answers = questions[id].answers;
		}
	}
	if (!answers) {
		questions[id].answers = {yes: 'Yes', no: 'No'};
		answers = questions[id].answers;
	}
	Object.keys(answers).forEach(function(answer) {
		if (typeof answers[answer] === 'string') {
			answers[answer] = {text: answers[answer]};
		}
	});
	if (!questions[id].color) {
		Object.keys(answers).forEach(function(answer, i, all) {
			if (i === 0) {
				answers[answer].color = answers[answer].color || 'red';
			} else if (i === 1) {
				if (all.length < 3) {
					answers[answer].color = answers[answer].color || 'blue';
				} else {
					answers[answer].color = answers[answer].color || 'brown';
				}
			} else {
				answers[answer].color = answers[answer].color || 'blue';
			}
		});
	} else {
		Object.keys(answers).forEach(function(answer, i, all) {
			answers[answer].color = answers[answer].color || questions[id].color + ['Light', 'Medium', 'Dark', 'DarkRoast'][i];
		});
	}
	var c = 'c3'; // 'c' + Object.keys(answers).length
	return $('<ul>').attr('data-question', id).append(
		$('<li>').addClass('noSelect').append(
			$('<h3>').addClass('bold').text(question.toUpperCase())
		),
		$('<div>').addClass('c3').append(
			Object.keys(answers).map(function(answer, i, all) {
				return $('<div>').attr('data-answer', answer).addClass('c3_col' + (i + 1 === all.length ? 'End' : i + 1)).addClass('c_' + answers[answer].color).append(
					$('<div>').addClass('c_label').text(answers[answer].text),
					$('<div>').addClass('c_percent')
				);
			})
		)
	);
}

var feels = stats.getEvents('feeled', startPeriod.getTime(), endPeriod.getTime());

$(document).ready(function() {
	stats.listen(['cummed', 'milked', 'ruined'], startPeriod.getTime(), endPeriod.getTime(), function() {
		updateStuff();
	});
	stats.listen(['edged'], startPeriod.getTime(), endPeriod.getTime(), function() {
		updateStuff();
		updateDoughnut();
	});
	stats.listen(['feeled'], startPeriod.getTime(), endPeriod.getTime(), function(feels) {
		updateFeels(feels);
	});
	updateStuff();
	updateFeels(feels);
	initDoughnut();
	initBoxes();
	initQuestions();
});

function updateStuff() {
	orgasms = stats.getEvents(['cummed', 'milked', 'ruined'], startPeriod.getTime(), endPeriod.getTime());
	cums = orgasms.filter(orgasm => orgasm.type === 'cummed');
	milks = orgasms.filter(orgasm => orgasm.type === 'milked');
	ruins = orgasms.filter(orgasm => orgasm.type === 'ruined');

	if (orgasms.length) {
		lastOrgasm = orgasms[orgasms.length - 1];
		var timeSinceLastOrgasm = Date.now() - lastOrgasm.time;
		edgesSince = stats.getEvents('edged', lastOrgasm.time);
		longestStreak = 0;

		orgasms.forEach(function(a, b) {
			if (b.time - a.time > longestStreak) {
				longestStreak = b.time - a.time;
			}
			return b;
		});
		var relapseDays = weekdays.map(function() { return 0; });
		orgasms.forEach(function(event, i) {
			var streak = i && (event.time - orgasms[i - 1].time);
			if (streak > longestStreak) {
				longestStreak = streak;
			}

			relapseDays[new Date(event.time).getDay()]++;
		});

		if (longestStreak < timeSinceLastOrgasm) {
			longestStreak = timeSinceLastOrgasm;
		}
		var longestStreakDays = Math.floor(longestStreak / (24*60*60*1000));

		frequentRelapse = weekdays[relapseDays.indexOf(Math.max.apply(null, relapseDays))];

		var daysSinceOrgasm = timeSinceLastOrgasm / (24 * 60 * 60 * 1000);
		$('.progress').each(function() {
			var $labels = $(this).find('.progress-toplabels .progress-mslabel');
			var $mss = $(this).find('.progress-ms');
			var $curr = $(this).find('.progress-curr');
			if ($mss.length && $labels.length && $curr.length) {

				var currLeft = $curr.offset().left;
				var minDays = +$labels.first().text() || 0;
				var minPx = $mss.first().offset().left - currLeft;
				var maxDays = +$labels.last().text();
				var maxPx = $mss.last().offset().left - currLeft;
				$curr.width((daysSinceOrgasm - minDays) / (maxDays - minDays) * (maxPx - minPx) + minPx);

				$labels.each(function(i) {
					var $label = $(this);
					var $ms = $mss.eq(i);
					var day = +$label.text();
					var left = (day - minDays) / (maxDays - minDays) * (maxPx - minPx);// + minPx;
					$ms.css('left', left);
					$label.css('left', left);
				});
			}
		});
	} else {
		$('.progress-curr').css('width', '0%');
	}

	$('#field-last-orgasm').text(lastOrgasm ? formatDateShort(new Date(lastOrgasm.time - startOfDay)) : 'never');
	$('#field-last-orgasm').attr('title', lastOrgasm ? formatTimespan(timeSinceLastOrgasm) + ' ago' : 'ever');
	$('#field-edges-since-last-orgasm').text(lastOrgasm ? edgesSince.length : '-');
	$('#field-longest-streak').text(lastOrgasm ? longestStreakDays === 1 ? '1 Day' : longestStreakDays + ' Days' : '-');
	$('#field-longest-streak').attr('title', lastOrgasm ? formatTimespan(longestStreak) : '');
	$('#field-frequent-relapse').text(lastOrgasm ? frequentRelapse : '-');
}

function formatDateShort(d) {
    return [d.getMonth() + 1, d.getDate(), String(d.getFullYear()).slice(-2)].join('/');
}

function formatTimespan(ms) {
	var parts = [];
	if (ms < 0) {
		ms = 0;
	}
	var seconds = Math.floor(ms / 1000);
	var minutes = Math.floor(seconds / 60);
	seconds -= minutes * 60;
	parts.push(seconds === 1 ? '1 second' : seconds + ' seconds');
	if (minutes) {
		var hours = Math.floor(minutes / 60);
		minutes -= hours * 60;
		parts.push(minutes === 1 ? '1 minute' : minutes + ' minutes');
		if (hours) {
			var days = Math.floor(hours / 24);
			hours -= days * 24;
			parts.push(hours === 1 ? '1 hour' : hours + ' hours');
			if (days) {
				parts.push(days === 1 ? '1 day' : days + ' days');
			}
		}
	}
	return parts.reverse().join(', ');
}

function updateFeels(feels) {
	var summary = {};
	feels.forEach(function(feel) {
		summary[feel.value] = (summary[feel.value] || 0) + 1;
	});
	$('#field-mood').text(feels.length ? feelings[feels[feels.length - 1].value].title : 'Undecided');
	$('[data-feel]').each(function() {
		$(this).text((summary[$(this).data('feel')] || 0).toLocaleString());
	});
}