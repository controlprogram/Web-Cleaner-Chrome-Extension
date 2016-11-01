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
			} else if (i === 2) {
				answers[answer].color = answers[answer].color || 'blue';
			} else {
				answers[answer].color = answers[answer].color || 'green';
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