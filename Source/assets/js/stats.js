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

var questions = {
	'cpr': {
		before: function() {
			var today = new Date();
			today.setHours(0);
			today.setMinutes(0);
			today.setSeconds(0);
			today.setMilliseconds(0);
			return !stats.getEvents(['cummed', 'milked', 'ruined'], today.getTime()).length;
		},
		question: 'Have you needed CPR today?',
		answers: {
			cummed: 'Cummed',
			milked: 'Prostate Milked',
			ruined: 'Ruined'
		},
		values: function() {
			return [cums.length, milks.length, ruins.length];
		},
		after: function(answer) {
			stats.addEvent(answer);
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
	}console.log(id, questions[id]);
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
	initTickets();
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

		frequentRelapse = weekdays[relapseDays.indexOf(Math.max.apply(null, relapseDays))];
	}

	$('#field-last-orgasm').text(lastOrgasm ? new Date(lastOrgasm.time).toDateString() : 'never');
	$('#field-edges-since-last-orgasm').text(lastOrgasm ? edgesSince.length : '-');
	$('#field-longest-streak').text(orgasms.length >= 2 ? Math.floor(longestStreak / (24*60*60*1000)) + ' Days' : '-');
	$('#field-frequent-relapse').text(lastOrgasm ? frequentRelapse : '-');
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

function initTickets() {
	var pages = document.querySelector('.ticket-pages'), page;
	for (var i = 0; i < 30; ++i) {
		if (i % 4 === 0) {
			page = document.createElement('div');
			page.className = 'ticket-page';
			pages.appendChild(page);
		}
		var ticket = new Image();
		ticket.src = drawTicket(i + 1, Math.random() * 360);
		page.appendChild(ticket);
	}
}