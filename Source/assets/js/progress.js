var doughnut, boxes;
var startOfDay = 2*60*60*1000;

function initDoughnut() {
  doughnut = $("#doughnutChart").drawDoughnutChart([
	{ title: "Cummed",		  get value() { return cums.length; },  color: "#D7757B" },
	{ title: "Prostate Milked", get value() { return milks.length; },   color: "#FEFDD5" },
	{ title: "Ruined",        get value() { return ruins.length; },   color: "#E0F0F3" }
  ], {
  	summaryTitle: 'TOTAL'
  });
}

$(document).on('click', '.button[data-role]', function() {({
	'report-cpr': function() {

	},
	'report-edge': function() {
		showModal();
	},
	'add-edges': function() {
		processModal();
	},
	'cancel': function() {
		hideModal();
	}
}[$(this).data('role')] || function(){}).apply(this, arguments);});

$(document).on('keypress', '#modalBackground input', function (e) {
	if (e.which == 13) {
		processModal();
	}
});

function updateDoughnut() {
	doughnut.update();
}

function initBoxes() {
	var $ticket = $('#ticket-box');
	var $feels = $('#feels-box');
	var $ticketPageContainer = $('#ticket-box .ticket-pages');
	var $ticketPages = $('#ticket-box .ticket-page');
	var ticketPageIndex = 0;

	switchBox('feels');

	$('.switch, .switchHl').click(function() {
		switchBox($(this).data('box'));
	});
	/*$feels.find('.smileyContainer').click(function() {
		stats.addEvent('feeled', Date.now(), $(this).find('[data-feel]').data('feel'));
		$(this).parent().animate({opacity: 0}, {always: function() {
			$(this).css({visibility: 'hidden'});
			if (!$feels.find('.smileyContainer').parent().filter(function() {return $(this).css('visibility') !== 'hidden';}).length) {
				switchBox('tickets');
			}
		}});
	});*/
	$('#ticket-box .arrowRight').click(function() {
		switchPage(ticketPageIndex + 1);
	});
	$('#ticket-box .arrowLeft').click(function() {
		switchPage(ticketPageIndex - 1);
	});

	function switchBox(box) {
		if (box === 'feels') {
			/*$feels.find('.smileyContainer').parent().css({opacity: 1, visibility: 'visible'});*/
			$ticket.hide();
			$feels.show();
		} else {
			$feels.hide();
			$ticket.show();
		}
		$('.switchHl').addClass('switch').removeClass('switchHl');
		$('.switch[data-box="' + box + '"]').addClass('switchHl').removeClass('switch');
	}

	function switchPage(page) {
		ticketPageIndex = (page + $ticketPages.length) % $ticketPages.length;
		$ticketPageContainer.animate({scrollLeft: $ticketPageContainer.scrollLeft() + $ticketPages.eq(ticketPageIndex).position().left});
	}
}

function initQuestions() {
	$('#questions > [data-question]').each(function() {
		var question = $(this).data('question');
		var $tmp = $('<div>');
		$tmp.append($(this));
		if (!questions[question]) {
			questions[question] = {};
		}
		questions[question].html = $tmp.html();
		/*if (!questions[question].answers) {
			questions[question].answers = {};
			$(this).find('[data-answer]').each(function() {
				return questions[question].answers[$(this).data('answer')] = $(this).text();
			});
		}*/
	});

	askSomething();
	function askSomething() {
		var now = new Date();
		// No question from 2am until 6am.
		if (2 <= now.getHours() && now.getHours() < 6) {
			return false;
		}

		var veryRecently = new Date();
		veryRecently.setHours(veryRecently.getHours() - 1);
		// Only at most one question per hour.
		if (stats.getEvents('answered', veryRecently.getTime()).length) {
			return false;
		}

		var question = 'cpr';
		var open = Object.keys(questions);
		while (!useQuestion(question)) {
			open.splice(open.indexOf(question), 1);
			if (!open.length) {
				return false;
			}
			question = open[Math.floor(Math.random() * open.length)];
		}
		var $question = makeQuestion(question);
		$question.find('[data-answer]').click(function() {
			var answer = $(this).data('answer');
			if (!questions[question].after || questions[question].after(answer) !== false) {
				stats.addEvent('answered', Date.now(), {question: question, answer: answer});
				$question.remove();
				askSomething();
			}
		});
		$('#questions').append($question);
		if (questions[question].answers) updatePercent();

		return true;


		function updatePercent() {
			var minWidth = 60;
			var minCssPercent = Math.ceil(minWidth / $question.children('div').width() * 100);
			var answers = Object.keys(questions[question].answers);
			var absolute;
			if (questions[question].values) {
				absolute = questions[question].values();
			} else {
				absolute = answers.map(a => 0);
				stats.getEvents('answered').filter(e => e.value.question === question).forEach(e => absolute[answers.indexOf(e.value.answer)]++);
			}
			var total = absolute.reduce((a, b) => a + b);
			if (total) {
				var percents = absolute.map(abs => Math.round(abs / total * 100));
				var cssPercents = percents.map(p => Math.round(minCssPercent + p * (100 - percents.length * minCssPercent) / 100));
			} else {
				cssPercents = absolute.map(p => Math.round(100 / absolute.length));
			}
			var $answerDivs = $question.find('[data-answer]');
			answers.forEach(function(answer, i, all) {
				var $div = $answerDivs.filter('[data-answer="' + answer + '"]');
				if (i < all.length - 1) $div.width(cssPercents[i] + '%');
				if (percents) $div.find('.c_percent').text(percents[i] + '%');
			});
		}
	}
	function useQuestion(question) {
		if (stats.getEvents('answered', today().getTime()).some(function(e) {return e.value.question === question;})) {
			return false;
		}
		if (questions[question].before && questions[question].before() === false) {
			return false;
		}
		return true;
	}
}

function showModal() {
	if (!$('#modalBackground').is(':visible')) {
		$('#modalBackground input').val('');
		$('#modalBackground').show();
	}
	$('#modalBackground input').focus();
}

function processModal() {
	var amount = +$('#modalBackground input').val();
	if (!amount || amount < 0 || amount % 1) {
		alert('Please enter a valid amount.');
	} else {
		for (var i = 0; i < amount; ++i) {
			stats.addEvent('edged');
		}
		hideModal();
	}
}

function hideModal() {
	$('#modalBackground').hide();
}