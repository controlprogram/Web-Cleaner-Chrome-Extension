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

var drawTicket = (function() {
	var img = new Image();
	img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANQAAABpCAMAAAB1VP2BAAABKVBMVEVBlbIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACBQYAAAAAAAAAAgIAAAAAAABAlLAAAAAAAAAAAABBlLEBAwNBlbJBlbFAlLA+jqcvbX8AAAAAAABAlrVBlLE/kqw7hp4jUWAYN0AAAABAlK8AAABAk69Ak61Ak61BlK42e5Ava30rYXI+jqcECQs9jadBlbA4gZk2fJEpXW4eRVJBlK0RJy0/kKg5g5s/kqs8iaE+j6k/kKk8iqMsY3M8iKI/jqYvZ3lBlbA3e5I4fJE4n+M4n+I4n+VBlbH////7/f44n+Q3oOY2oes3oOk5n+M2oOw2oe03oOg5ntw6nNc6nNRAl7g4nuA9mMQ+mLxAlrQ7nNA8m8w9mcc+mME/l748oeM4n+E7m8/oWqjDAAAARXRSTlP+AAEEBx0KMiomEBc+OyIU+DgMEvs1+/Xr12EwGv7938RpVTk4LvDOtpOJiFYkFcrAr6toXFhOQyEVz8Wvo351aWhlTDvQAga7AAADrklEQVR42u3cZ2/aQBjA8QcvjI2N2ZCQne4m3XsPnwl3NsZsmtH2+3+InjukKiKkKW3C49z/NUj8dLoHsE+GCiSuCjQ71EtUtNMEoCRhUQDwiJuoiCdQOBIoLAkUlgQKS2dFtfbcC6+1J1CXFIUigcKSQPFaLffCa7XE9LukKBQJFJYESoz031vw6ZdI1I+a558YFAKFpO+oThB55M9gewswKGZ/BuJ6LABoHux3WSciBD+KEBaGXpc24U69tjo57IYBRY/ywuHBYLIKJcikrY1bz0uDrz5DvbkI87vj1bX7tzYe3IbMcj6bzT6+d3Uw9BGrSMDGpfVNTtlKZ0DV0+W8ZWWz91f7eFXE78H646xlbeXTug2mmtGvxK7sxtVPHRdpnU/O66y1VU4vX9HtBhg5U7VjV97adPhaYRwUX/y+89DKl5f1jK2qZhEUrWAUzYaduVLe2nR6AcGHIkHf2bQ4yVbNXNEoaCDJsqJoRq5h6+n8rYlP0aGIF8FGvJXUXQ5SFFmGVEqSJJmz+OZK5+ujkLhz1z7Lq+YvPFrPpzOqaWgcJPEgFRezCjmueghDNjfp8xlR8RvmKOo5FjflCgoXpeI46hdLy/HxXh/57rk2/5oF4/XYpP0ixajfVbZ+c4VRF1WUwgP9p+k4irOUgpkpOz2GalCQaL+2bJsFmZOmoWSlqOpro4CgQvmHdV01FGk6iqv4Ut05CnGhgsE9e1fjCzUVxVV8qW6uRC6mKIN3alHhphNRRuM2eKgmBfVgqVGQZ6DkgrkEuMYfZbBkanJqOiqOT/UlfCt1OzcTxTdVvFIXNSjaf/PbL1q5ybfUbNSrwYWN9PZfTb/w6IVxCsqoH/rzotrnigpGa6eiavsRrj/1rOfsnoL6ABTVnIjH38qbmShZezkOXGT5o2uzR7rh9HD9oOCxIXyc+eV7/SjE93c+HF1TZqCeQOQRbCiX+pO3J6Kkp9U+zqtJvepTaTpK2qn2/S8uwojfr+5IU1GPqpiv0F7dnoJ6dh16mK+l9ys3pGOonevOmAVoTbFqOKjdePYTtf1k+/2NNRh3fUYw33QjzP86KN19tB2jSlCZDA6GoYf+9igNwu7hpFK7dheatOuFIUvGPd+ow7r7B02AgHku4s10jOVFQSep5ygECkHiEON/OO/XXoTzfv8Y1V4IFIoECksCJUb6yS3cEe5EolC0oKh2ElGJXCkx0sX0uzQoFAkUlgQKSwKFJYHCUnJRSXxmZiKfblqCxFX6BgKbCul8sG0lAAAAAElFTkSuQmCC';
	var can = document.createElement('canvas');
	var width = can.width = img.width;
	var height = can.height = img.height;
	var ctx = can.getContext('2d');
	ctx.drawImage(img, 0, 0);
	var orig = ctx.getImageData(0, 0, width, height);
	return function(days, hue) {
		var data = ctx.createImageData(width, height);
		var h = 360*Math.random(), days = Math.round(365 * Math.random());
		for (var i = 0, y = 0; y < height; ++y) {
			for (var x = 0; x < width; ++x) {
				var col = [
					orig.data[i+0],
					orig.data[i+1],
					orig.data[i+2],
					orig.data[i+3]
				];
				changeHue(col, h);
				data.data[i++] = col[0];
				data.data[i++] = col[1];
				data.data[i++] = col[2];
				data.data[i++] = col[3];
			}
		}
		ctx.putImageData(data, 0, 0);
		ctx.font = '24px serif';
		ctx.textAlign = 'center';
		ctx.fillStyle = 'white';
  		ctx.fillText(days + " DAYS", width/2, height/2);
		ctx.font = '16px serif';
  		ctx.fillText("ADMIT ONE", width/2, height*.75);
  		return can.toDataURL();
  	}
	function changeHue(col, h) {
		var v = Math.max(col[0], col[1], col[2]), s = v && (v - Math.min(col[0], col[1], col[2])) / v;
		var hi = Math.floor(h / 60) % 6, f = h / 60 - hi;
		var p = v * (1 - s), q = v * (1 - s * f), t = v * (1 - s * (1 - f));
		var zx = [p, p, t, v, v, q];
		col[0] = zx[(hi+4)%6];
		col[1] = zx[(hi+2)%6];
		col[2] = zx[hi];
	}
}());