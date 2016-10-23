var doughnut, boxes;

function initDoughnut() {
  doughnut = $("#doughnutChart").drawDoughnutChart([
	{ title: "Cummed",		  get value() { return cums.length; },  color: "#D7757B" },
	{ title: "Prostate Milked", get value() { return milks.length; },   color: "#FEFDD5" },
	{ title: "Ruined",        get value() { return ruins.length; },   color: "#E0F0F3" }
  ], {
  	summaryTitle: 'TOTAL'
  });
}

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
	$feels.find('.smileyContainer').click(function() {
		stats.addEvent('feeled', Date.now(), $(this).find('[data-feel]').data('feel'));
		$(this).parent().animate({opacity: 0}, {always: function() {
			$(this).css({visibility: 'hidden'});
			if (!$feels.find('.smileyContainer').parent().filter(function() {return $(this).css('visibility') !== 'hidden';}).length) {
				switchBox('tickets');
			}
		}});
	});
	$('#ticket-box .arrowRight').click(function() {
		switchPage(ticketPageIndex - 1);
	});
	$('#ticket-box .arrowLeft').click(function() {
		switchPage(ticketPageIndex + 1);
	});

	function switchBox(box) {
		if (box === 'feels') {
			$feels.find('.smileyContainer').parent().css({opacity: 1, visibility: 'visible'});
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
	askSomething();
	function askSomething() {
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
			if (!questions[question].after || questions[question].after() !== false) {
				stats.addEvent('answered', Date.now(), {question: question, answer: answer});
				$question.remove();
				askSomething();
			}
		});
		$('#questions').append($question);
		updatePercent();

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
		var recently = new Date();
		recently.setHours(recently.getHours() - 6);
		if (stats.getEvents('answered', recently.getTime()).some(function(e) {return e.value.question === question;})) {
			return false;
		}
		if (questions[question].before && questions[question].before() === false) {
			return false;
		}
		return true;
	}
}