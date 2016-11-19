/*
This is the script file for the options page. It handles loading the options from localStorage as well as writing them back to localStorage and the background page.
	Author: Joseph Gray
	Date Created: 10/22/2012
	Date Updated: 11/5/2012
	
	
	   Copyright 2013 Joseph Gray

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var opt, password = '';

// This function updates an html element to show the change in a the slider bar value for the image scanner sensitivity.
function showValue() {
	document.getElementById('range2').innerHTML = document.getElementById("scanner_sensitivity").value + '%';
}

function show_options() {
	if (password !== opt.password) {
		document.getElementById('saved_note').innerHTML = 'Code: ' + opt.code;
		document.getElementById('settings_stuff').style.display = 'none';
		document.getElementById('save_button').style.display = 'none';
		return;
	}
	Object.keys(opt).forEach(function(key) {
		var q, a, v = opt[key];
		if (key === 'code') {
			q = '#saved_note';
			a = 'innerHTML';
			v = 'Code: ' + opt[key];
		} else if (key === 'image_replacement') {
			if (opt[key]) {
				q = '#image_replacement [value="' + opt[key] + '"]';
				a = 'checked';
			} else {
				q = null;
			}
		} else if (key === 'replace_sentence') {
			q = null;
			//document.querySelector('[name="WordOrSentence"][value="' + (opt[key] ? 'sentence' : 'word') + '"]').checked = true;
		} else if (key.slice(-3) === '_on') {
			q = '[name="' + key + '"][value="' + opt[key] + '"]';
			a = 'checked';
			v = true;
		} else if (typeof opt[key] === 'boolean') {
			q = '#' + key + '_checkbox';
			a = 'checked';
		} else if (typeof opt[key] === 'string' || typeof opt[key] === 'integer') {
			q = '#' + key;
			a = 'value';
		}
		if (q) {
			var el = document.querySelector(q);
			if (!el) {
				console.log(q + ' does not exist.');
			} else {
				el[a] = v;
			}
		}
	});
	showValue();
	toggleWrapper('text', 'text_filter');
	toggleWrapper('image', 'image_filter');
	toggleWrapper('schedule', 'schedule');
	document.getElementById('settings_stuff').style.display = 'block';
	document.getElementById('save_button').style.display = 'inline-block';
}

function save_and_update_background() {
	Object.keys(opt).forEach(function(key) {
		var q, a;
		if (key === 'image_replacement') {
			q = '#image_replacement :checked';
			a = 'value';
		} else if (key === 'replace_sentence') {
			q = null;
		} else if (key.slice(-3) === '_on') {
			q = '[name="' + key + '"][value="' + opt[key] + '"]';
			a = 'checked';
		} else if (typeof opt[key] === 'boolean') {
			q = '#' + key + '_checkbox';
			a = 'checked';
		} else if (typeof opt[key] === 'string' || typeof opt[key] === 'integer') {
			q = '#' + key;
			a = 'value';
		}
		if (q) {
			var el = document.querySelector(q);
			if (!el) {
				console.log(q + ' does not exist.');
			} else {
				opt[key] = el[a];
			}
		}
	});
	chrome.extension.getBackgroundPage().storeOptions(opt).then(function() {
		load_page();
	});
}


function load_page()
{
	chrome.extension.getBackgroundPage().loadOptions().then(function(values) {
		opt = values;
		show_options();
	});
}

function validateWordLists() {
	['blocked_words', 'image_blocked_words'].map(function(id) {
		return document.getElementById(id);
	}).forEach(function(element) {
		element.value = element.value.split('\n')
			// Words shouldn't start or end with whitespace.
			.map(function(word) {
				return word.trim();
			})
			// Words shouldn't be empty.
			.filter(Boolean)
			// Words should be a valid regexp pattern that doesn't match the empty string.
			.map(function(pattern) {
				try {
					if (!new RegExp(pattern).test('')) {
						return pattern;
					}
					// Matches the empty string.
				} catch (e) {
					// Non-valid pattern.
				}
				// Escape everything that isn't escaped.
				return pattern.replace(/\\?((?:\\\\)*[\\\.\+\*\?\^\$\|\[\]\{\}\(\)])/g, "\\$1");
			})
		.join('\n');
	});
}

function toggleWrapper(radioOn, wrapper) {
	var on = document.querySelector('[name=' + radioOn + '_on]:checked');
	wrapper = document.getElementById(wrapper + '_wrapper');
	if (on.value == "true") {
		wrapper.classList.remove('hidden');
	} else {
		wrapper.classList.add('hidden');
	}
}





function save_button()
{
	validateWordLists();
	save_and_update_background();
}

// These are the event handlers for the options page.

// This event is when the slider bar is changed. It will update the html value of the number that shows the value of the slider bar.
document.getElementById("scanner_sensitivity").addEventListener('change', showValue);

// This event will load the options, populating all the fields, and checking the appropriate radio/checkbox buttons.
document.addEventListener('DOMContentLoaded', load_page);

// This event handles what happens when the save button is clicked.
document.getElementById("save_button").addEventListener('click', save_button);

document.getElementById("password").addEventListener('keyup', function() {
	password = document.getElementById("password").value;
	if (password === opt.password) {
		show_options();
	}
}, false);

[].forEach.call(document.getElementsByName('image_on'), function(radio) {
	radio.addEventListener('change', function() {toggleWrapper('image', 'image_filter');});
});

[].forEach.call(document.getElementsByName('text_on'), function(radio) {
	radio.addEventListener('change', function() {toggleWrapper('text', 'text_filter');});
});

[].forEach.call(document.getElementsByName('schedule_on'), function(radio) {
	radio.addEventListener('change', function() {toggleWrapper('schedule', 'schedule');});
});