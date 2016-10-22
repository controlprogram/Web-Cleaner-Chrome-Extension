var stats = chrome.extension.getBackgroundPage().stats;
var weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var orgasms = stats.getEvents(['cummed', 'milked', 'ruined']);
var cums = stats.getEvents('cummed');
var milks = stats.getEvents('milked');
var ruins = stats.getEvents('ruined');

var lastOrgasm = null, edgesSince, longestStreak, frequentRelapse, relapseDays;


$(document).ready(function() {
	stats.listen(['cummed', 'milked', 'ruined', 'edged'], null, null, updateStuff);
	updateStuff();
	$('#question-cpr .c3_col1').click(function() {
		stats.addEvent('cummed');
	});
	$('#question-cpr .c3_col2').click(function() {
		stats.addEvent('milked');
	});
	$('#question-cpr .c3_colEnd').click(function() {
		stats.addEvent('ruined');
	});
});

function updateStuff() {
	orgasms = stats.getEvents(['cummed', 'milked', 'ruined']);
	cums = stats.getEvents('cummed');
	milks = stats.getEvents('milked');
	ruins = stats.getEvents('ruined');

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

		cumsPercent = Math.round(cums.length / orgasms.length * 100) + '%';
		milksPercent = Math.round(milks.length / orgasms.length * 100) + '%';
		ruinsPercent = Math.round(ruins.length / orgasms.length * 100) + '%';
		frequentRelapse = weekdays[relapseDays.indexOf(Math.max.apply(null, relapseDays))];
	}

	$('#field-last-orgasm').text(lastOrgasm ? new Date(lastOrgasm.time).toDateString() : 'never');
	$('#field-edges-since-last-orgasm').text(lastOrgasm ? edgesSince.length : '-');
	$('#field-longest-streak').text(orgasms.length >= 2 ? Math.floor(longestStreak / (24*60*60*1000)) + ' Days' : '-');
	$('#field-frequent-relapse').text(lastOrgasm ? frequentRelapse : '-');
	$('#question-cpr .c3_col1').width(cumsPercent);
	$('#question-cpr .c3_col1 .c_percent').text(cumsPercent);
	$('#question-cpr .c3_col2').width(milksPercent);
	$('#question-cpr .c3_col2 .c_percent').text(milksPercent);
	$('#question-cpr .c3_colEnd').width(ruinsPercent);
	$('#question-cpr .c3_colEnd .c_percent').text(ruinsPercent);
	updateDoughnut();
}