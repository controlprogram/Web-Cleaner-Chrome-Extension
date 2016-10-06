/* This is the content script that will run the filters.
Author: Joseph Gray
Date Created: 11-18-2012
Date Modified: 3-19-2013



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

/* Some modifications were done to make use of native image parsing.
Author: rob204
Date Modified: 6-10-2016

	   Copyright 2016 rob204

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


var options; // Give the options object global reference so we can hopefully use it in the DOM Mutation stuff.
var word_count = 0; // This is a counter variable for the text filter for blocking pages. It is given global scope so that we can use it in the initial filter as well as the text_changes_filter.

var text_observer;
var image_observer;

// Using the 'DOMContentLoaded event means that you might be able to briefly see a flash of the content that will eventually be filtered. If the page takes a long time, you will get a good look at content that should be filtered.
// However, directly calling the load_filters funtion results in some text content escaping both the filter and the Mutation observer.
// So we do both.
load_filters();
document.addEventListener('DOMContentLoaded', load_filters);



// This function will be called as soon as the DOM is ready for manipulation, this function will request the options object from the background
// script, and load it into the options variable listed above.
function load_filters()
{
//window.alert("Inside load filters function"); // used for testing.

chrome.extension.sendMessage({"greeting": "request_options"}, 
function(response)
{
  options = (response.farewell);
  
  // This must be placed here, since sendMessage is an asyncronous function, meaning that code execution continues after this function before this function completes.
  // Therefore, everything that requires the options object must be placed  within this function to ensure that it executes after the options object is retrieved from the background script.
  
  // Line below used for testing in Test Case 002
  //window.alert("text_on " + options.text_on + "\n" + "blocked_words " + options.blocked_words + "\n" + "whitelisted_websites " + options.whitelisted_websites + '\n' + "replace_sentence " + options.replace_sentence + '\n' + "block_paragraph " + options.block_paragraph + '\n' + "block_webpage " + options.block_webpage + '\n' + "num_paragraph " + options.num_for_paragraph + '\n'+ "num_webpage " + options.num_for_webpage + '\n' + "image_on " + options.image_on + '\n' + "image_blocked_words " + options.image_blocked_words + '\n' + "image_whitelist " + options.image_whitelisted_websites + '\n'+ "image_scanner " + options.image_scanner + '\n' + "scanner_sensitivity " + options.scanner_sensitivity);  //This was included to test that the options object was properly passed
  
  // When an option is pulled from localStorage, it is in the form of a string. When it is pulled directly from the html of the options page, the checked method returns a boolean.
  // I modified the background script to convert the string to a boolean, so we don't have to worry about it here.
  if (options.text_on == true )
 {
 
	//window.alert("Text filter on."); // Used for testing.  Test Case 005
	
	// Check to ensure that this website is not whitelisted on the text filter.
	if(options.whitelisted_websites != null && options.whitelisted_websites != "") // When no whitelisted websites exist, and the options have not been saved yet, options.whitelisted_websites will have a null value, which cannot be split. This handles that eventuality.
	{
		var whitelist = new RegExp( '(\S*' + options.whitelisted_websites.split('\n').join('\S*|\S*') + '\S*)', 'igm');
		var website = window.location.hostname;
		if (website.match(whitelist) == null) // the indexOf will return -1 if it does not find the hostname in the whitelist
		{
			
			//window.alert(options.whitelisted_websites.split('\n')); // used for testing.
			//window.alert(window.location.hostname); // used for testing.
			//window.alert("Website not whitelisted."); // Used for testing.
			//window.alert("The webpage was not whitelisted."); // Used for testing purposes.  Test Case 005
		
			// If we don't find the website listed in the whitelist, call the text filter function.
			text_preparation();
			
			// After we have called the text filter, create an observer using the Mutation Observer API that will find any changes in text nodes.
			// The MutationSummary constructor takes a single parameter that is an object defined within the same line.
			// The object has 2 elements: callback, which refers to a function that will be called whenever a change is detected. This function is given 1 parameter, which is an array containing objects
			// describing the changes. The second element in the object is queries, which is an array of objects, each object being a specific query looking for certain changes.
			// In this particular case, the only query we have looks for changes to character Data (text nodes and comment nodes).
			
			
			text_observer = new MutationSummary(  {  callback: text_changes_preparation,  queries: [  { characterData: true }  ] }  ); // Done so that we can filter out content created by scripts.
			
		} // end if webpage is whitelisted
		//else
		//window.alert("Website whitelisted."); // Used for testing. Test Case 005
		
	} // end if there is a whitelist
	
	else
	{
		// If the whitelist is null or empty, call the text filter function.		
		//window.alert("Text filter calling."); // Used for testing.
		//window.alert("The webpage was not whitelisted."); // Used for testing purposes.  Test Case 005
		
		text_preparation();
		
		//window.alert("Text filter has exited, starting text observer."); // used for testing.
		
		// After we have called the text filter, create an observer using the Mutation Observer API that will find any changes in text nodes.
		// The MutationSummary constructor takes a single parameter that is an object defined within the same line.
		// The object has 2 elements: callback, which refers to a function that will be called whenever a change is detected. This function is given 1 parameter, which is an array containing objects
		// describing the changes. The second element in the object is queries, which is an array of objects, each object being a specific query looking for certain changes.
		// In this particular case, the only query we have looks for changes to character Data (text nodes and comment nodes).

		text_observer = new MutationSummary({	callback: text_changes_preparation,  queries: [{ characterData: true }]  }); // Done so we can filter out content created by scripts.
		
		//window.alert("Created text observer."); // Used for testing.
	} // end else
 } // end if options.text_on
 //else
	//window.alert("Text filter function not called."); // Used for testing. Test Case 005
	
 // If the image filter is on, call the image filter function.
 if (options.image_on == true)
 {
  
		
		
		// Check if the webpage is whitelisted.
		if(options.image_whitelisted_websites != null && options.image_whitelisted_websites != "") // When no whitelisted websites exist, and the options have not been saved yet, options.whitelisted_websites will have a null value, which cannot be split. This handles that eventuality.
		{
			var whitelist = new RegExp( '(' + options.image_whitelisted_websites.split('\n').join('|') + ')', 'igm');
			var website = window.location.hostname;
			if (website.match(whitelist) == null) 
			{
				//window.alert(options.whitelisted_websites.split('\n')); // used for testing.
				//window.alert(window.location.hostname); // used for testing.
				//window.alert("Website not whitelisted."); // Used for testing.
				
				image_preparation();
				
				//window.alert("Called image filter, making image observer."); // used for testing.
				
				// This creates a new mutation summary observer. It will call image_changes_filter whenever an 'img' element is added, removed, reparented, or whenever the 'src' attribute of an image element is changed.
				image_observer = new MutationSummary({
																						callback: image_changes_preparation,
																						queries: [{ attribute: "src"}]
																					}); // Done so we can filter out content created by scripts.
			
				//window.alert("Called image observer"); // used for testing.
			} // end if webpage is whitelisted
		
		} // end if there is a whitelist
		else
		{
		
			image_preparation();
			
			//window.alert("Called image filter, making image observer."); // used for testing.
			
			// This creates a new mutation summary observer. It will call image_changes_filter whenever an 'img' element is added, removed, reparented, or whenever the 'src' attribute of an image element is changed.
			image_observer = new MutationSummary({
																					callback: image_changes_preparation,
																					queries: [{ attribute: "src"}]
																				}); // Done so we can filter out content created by scripts.
			
			//window.alert("Called image observer"); // used for testing.
		} // end else
	
 } // end if options.image_on

} // end response function
); // end messenger

} // end load_filters function





// getTextNodes This funtion will iterate down through all the children of the supplied nodes and create an array of text nodes.
function getTextNodes (root)
{

	var textNodes = new Array(); // Create the array
	
	// For each of the children of the node passed in as a parameter...
	for (var i = 0; i < root.childNodes.length; i++)
	{
		// If the child is an element node (such as a div or par, etc), call getTextNodes on that node, and concatenate the results with the current array.
		if (root.childNodes[i].nodeType == 1) 
		{
			textNodes = textNodes.concat(getTextNodes(root.childNodes[i]));
		} // end if
		
		// If the child node is a text node, add it to the array of text nodes.
		else if ((root.childNodes[i].nodeType == 3) && (root.childNodes[i].nodeValue != ""))
		{
			textNodes.push(root.childNodes[i]);
		} // end else if
	} // end for
	
	// Return the array of text nodes.
	return textNodes;
} // end getTextNodes




/*
This function will create an array of text nodes from the DOM to pass into the text_filter function.
*/
function text_preparation()
{
	//window.alert("Instide text_preparation function."); // Used for testing.
	
	// This calls getTextNodes, which is a recursive function that returns an array of text nodes below the parameter node.
	// It gives getTextNodes the root node (the 'html' node). So all text nodes on the page are returned.
	// It then passes this array to text_filter.
	text_filter(getTextNodes(document.getElementsByTagName("html")[0]));
} // end text prep function



/*
This function will parse the summary object from the text observer, creating an array of text nodes, which it then passes to text_filters.
*/
function text_changes_preparation(changes)
{
	//window.alert("Inside text_changes_prep function."); // Used for testing.
	
	// This parses the summary object and then passes the resulting array into text_filters.
	text_filter(changes[0].added.concat(changes[0].valueChanged));
} // end text changes prep function





/* This function will perform the text filter operations.
It takes in a single parameter: an array of text nodes.

First, it checks to ensure that the text filter is turned on. If not, it returns.
It then creates RegExp of blocked words.
It then searches through each text node for the blocked words, replacing them with and equivalent number of '*' as letters in the word. The function will keep track of the total number of words blocked, as well
as the number of words blocked in a given node (presumably a single paragraph). If the correct options are selected, it will eventually simply delete the entire webpage and replace it with a simple webpage stating that
the original webpage has been blocked.
*/
function text_filter(text_nodes)
{
	//window.alert("Inside text filter."); // Used for testing. Test Case 005
	
	if (options.text_on == false)
	{
		//window.alert("Text filter not on."); // Used for testing.  Test Case 005
		return;
	} // end if
	
	//window.alert("text_on " + options.text_on + "\n" + "blocked_words " + options.blocked_words + "\n" + "whitelisted_websites " + options.whitelisted_websites + '\n' + "replace_sentence " + options.replace_sentence + '\n' + "block_paragraph " + options.block_paragraph + '\n' + "block_webpage " + options.block_webpage + '\n' + "num_paragraph " + options.num_for_paragraph + '\n'+ "num_webpage " + options.num_for_webpage + '\n' + "image_on " + options.image_on + '\n' + "image_blocked_words " + options.image_blocked_words + '\n' + "image_whitelist " + options.image_whitelisted_websites + '\n'+ "image_scanner " + options.image_scanner + '\n' + "scanner_sensitivity " + options.scanner_sensitivity);  //This was included to test that the options object was properly passed

	
	/*   ERROR WITH THIS FEATURE
	// If we are going to be replacing sentences, use the created the blocked_pat for sentences, if we are going to only block words, set blocked_pat for just the words.
	// We could also choose to not store the RegExp in a variable, and re-create it every iteration through the loop. I am unsure of which would be better, but I suspect that taking up
	// memory is better than creating additional actions for the CPU to perform.
	if (options.replace_sentence == true)
	{
		//window.alert("Making Sentence Pattern."); // used for testing. Test Case 006
		
		// We are replacing sentences, so make the pattern accordingly.
		var blocked_pat = new RegExp( '([A-Z]?[\\s\\S]*' + options.blocked_words.split('\n').join('[\\s\\S]*[.?!]?|[A-Z]?[\\s\\S]*') + '[\\s\\S]*[.?!]?)', 'igm');
		// The [A-Z] will match any uppercase letter (the capital letter hopefully at the beginning of a sentence.) followed by any number of either whitespace characters (\s) or non-whitespace characterss (\S).
		// We then join the array of blocked words into a string separated by notation that looks for any number of whitespace and non-whitespace characters followed by either '.', '?', or '!' and then the 'or' symbol,
		// followed by the the beginning of sentence notation described above. This should find all sentences containing one or more of the blocked words. However, if a sentence has multiple blocked words, it will
		// find the same sentence multiple times, one time for each word. This may be able to be optimized at a later date.
		
		//window.alert(blocked_pat); // Used for testing.
	} // end if
	else
	{
		//window.alert("Making Word Pattern."); // used for testing.
	
		// This creates a RegExp that looks for each of the blocked words, with any number of word characters surrounding it.
		// So if options.blocked_words contains bob\nsam\ntom, then blocked_words_pat will be the RegExp (\w*bob\w*|\w*sam\w*|\w*tom\W*) with igm modifiers.
		// This RegExp matches any word that contains either bob, sam, or tom within it, with global multi-line matching and is not case sensitive.
		var blocked_pat = new RegExp( '(\\w*' + options.blocked_words.split('\n').join('\\w*|\\w*') + '\\w*)', 'igm');
		
	} // end else
	*/
	var blocked_pat = new RegExp( '(\\w*' + options.blocked_words.split('\n').join('\\w*|\\w*') + '\\w*)', 'igm');
	
	//window.alert(blocked_pat); // Used for testing.	
	//window.alert(text_nodes); // used for testing.
	//window.alert("Number of text nodes: " + text_nodes.length); // Used for testing purposes.
	/*for (var i = 0; i < text_nodes.length; i++) // Used for testing
	{
		window.alert("Text Content: " + text_nodes[i].nodeValue); // Used for testing
	}*/
	
	
	
	// loop through the array of text nodes, scrubbing each node as you go.
	for (var i = 0; i < text_nodes.length; i++)
	{
		var paragraph_count = 0; // This creates a paragraph counter to check against the number to block paragraphs on (if the option is selected).
		
		//window.alert(blocked_pat); // Used for testing.
		
		
		
		var matches = text_nodes[i].nodeValue.match(blocked_pat); // This creates an array containing all the strings that matched the blocked_words_pat and gives it the name matches.
		
		if (matches != null) // If we have matches...
		{
			// We check if we are replacing words or sentences. If we are replacing sentences, we use the word RegExp to create a temporary array to find the number of words to add to paragraph_count.
			// We have to do this since a sentence might have multiple blocked words. I used an if statement, since if a user leaves the option on replacing words, it will be quicker, and it will not be too
			// much slower for users who replace sentences.
			/*
			if (options.replace_sentence == true)
			{
				// This add the number of words found to the paragraph count. We have to use a new RegExp since we are replacing sentences and a sentence might have multiple blocked words contained within it.
				paragraph_count += text_nodes[i].nodeValue.match(new RegExp( '(\w*' + options.blocked_words.split('\n').join('\w*|\w*') + '\w*)', 'igm')).length; 
			} // end if
			else
			{
				paragraph_count += matches.length; // This adds the number of words found to paragraph_count.
			} // end else
			*/
			paragraph_count += matches.length;
			
			word_count += paragraph_count; // This adds the number of words found to word count.
			
			//window.alert("Paragraph count: " + paragraph_count); // Used for testing. Test Case 007
			//window.alert("Word count: " + word_count); // Used for testing. Test Case 008
			
			// If we have turned on paragraph blocking, check to see if we have surpassed the word limit of the paragraph.
			if ((options.block_paragraph == true) && (options.num_for_paragraph <= paragraph_count))
			{
				// If we have surpassed the limit, replace the text node's value with "This paragraph has been censored."
				text_nodes[i].nodeValue = "This paragraph has been censored.";
					
				//window.alert("Paragraph censored."); // Used for testing. Test Case 007
			
			} // end paragraph block if
			
			// If we have turned on the webpage blocking, check to see if we have surpassed the word limit on the webpage.
			if ((options.block_webpage == true) && (options.num_for_webpage <= word_count))
			{
				//window.alert ("Blocking Webpage"); // Used for testing Test Case 008
				
				// First, stop loading the webpage.
				window.stop(); // May be unnecessary.
			
				var root = document.getElementsByTagName('html')[0]; // Get the root node.
			
				// Remove all the other nodes of the webpage.
				while (root.childNodes.length > 0)
				{
					root.removeChild(root.childNodes[0]);
				} // end while
			
				//window.alert("Done removing nodes."); // Used for testing
				
				// Create a head and body node for the webpage.
				var head = document.createElement('head');
				var body = document.createElement('body');
			
				// Add the head node to the webpage.
				root.appendChild(head);
			
				// Add a title for the webpage.
				document.title = "Webpage Censored.";
			
				// Create a paragraph node along with its text.
				var paragraph = document.createElement('h1');
				var text = document.createTextNode('This page has been censored due to an excess amount of inappropriate material.');
			
				// Give the paragraph node its text.
				paragraph.appendChild(text);
			
				// Put the paragraph in the body.
				body.appendChild(paragraph);
			
				// Put the body into the webpage.
				root.appendChild(body);
				
				//window.alert("Replaced Webpage."); // Used for testing 
				
				break; // This breaks out of the loop going through the text nodes.
			} // end webpage block if

			// If we neither block the paragraph nor webpage loop through all the matches, and then replace each word/sentence with a string of '*' of equivalent length.
			for (var j = 0; j < matches.length; j++)
			{
				// The replace method will return a string where all the first arguments are replaced by the second argument.
				// new Array(matches[j].length + 1) will create an array of null values that has 1 more element than the number of characters in matches[j]
				// Once this array is created, join is called on it. This returns the array as a string, with each element of the array separated by an *. Since the elements are null, this will
				// only return the *'s. Also, since there is one more element than the num of characters in matches[j], the num of * will be the same as the number of characters in matches[j].
				text_nodes[i].nodeValue = text_nodes[i].nodeValue.replace(matches[j], new Array(matches[j].length + 1).join('*'));
			} // end for
			
		} // end matches if
		

	} // end text node for
	
	
} // end text filter function



/* This is the preparation function for the image filter
It simply looks through the entire webpage, collecing all elements with a tag of 'img' and puts them in an array.
It then calls image_filter and passes this array into it.
*/
function image_preparation()
{
	//window.alert("Inside image_prep function."); // Used for testing.
	
	image_filter(document.getElementsByTagName("img")); // This creates an array of all the image nodes and passes it into the image_filter function.

} // end image prep function



/*
This is the preparation function that parses the summary object from the mutation observer.
This is the callback function for the image_observer.
First, it parses the summary object and then passes the resulting array into the image_filter function.
*/
function image_changes_preparation(changes)
{
	//window.alert("Inside image_changes_prep function."); // Used for testing.
	
	//This parses the changes object and creates an array of image nodes that have been added or changed.
	// This array is then passed in as the parameter for the image_filter function.
	
	var parameter = changes[0].added.concat(changes[0].valueChanged); // Assign all additions and changes to the parameter array
	
	var i = parameter.length - 1; // initialize a counter variable
	// Loop through the array, removing anything that is not an image. We count down to avoid overunning the array if we delete any nodes.
	while (i >= 0)
	{
		if (parameter[i].nodeName != "IMG")
		{
			parameter.splice(i, 1);
		} // end if
		i--;
	} // end while
	
	// Check that the parameter length is greater than 0. If so, call the image_filter function.
	if (parameter.length > 0)
	{
		image_filter(parameter);
	} // end if
} // end image changes prep function



/* This function will perform the image filter operations. First, it checks to ensure that the image filter is turned on, if not, it returns.
Second, it checks to see if the current webpage is whitelisted, if it is, it returns.
Thirdly, it creates a RegExp of blocked words
The function loops through the array parameter, searching the src, name, and alt attributes (properties) of each image. If it matches any of the blocked words to any word in these attributes,
then the image is replaced with a blank white image. Otherwise, it will call the image scanner function. If this function returns true, then this function will replace the image with
the blank white image, otherwise, it will return.
*/
function image_filter(images)
{
	//window.alert("Inside image filter."); // used for testing.
	//window.alert("image_on " + options.image_on + '\n' + "image_blocked_words " + options.image_blocked_words + '\n' + "image_whitelist " + options.image_whitelisted_websites + '\n'+ "image_scanner " + options.image_scanner + '\n' + "scanner_sensitivity " + options.scanner_sensitivity);  //This was included to test that the options object was properly passed
  
	
	if (options.image_on != true)
		return; // If the image filter isn't on, return.
	// end if
	
	//window.alert("Blocked words: " + options.image_blocked_words); // used for testing.
	
	// This creates a RegExp that looks for each of the blocked words, with any number of word characters surrounding it.
	// So if options.blocked_words contains bob\nsam\ntom, then blocked_words_pat will be the RegExp (\S*bob\S*|\S*sam\S*|\S*tom\S*) with igm modifiers.
	// This RegExp matches any word that contains either bob, sam, or tom within it, with global multi-line matching and is not case sensitive.
	// I used \S instead of \w since \w only matches word characters (letters and numbers) while \S matches anything not whitespace.
	// This is necessary since image urls will contain non-word non-whitespace characters in the singel string.
	var word_pat = new RegExp( '(\\S*' + options.image_blocked_words.split('\n').join('\\S*|\\S*') + '\\S*)', 'igm');
	
	//window.alert(word_pat); // Used for testing.
	
	for (var i = 0; i < images.length; i++)
	{
	
		//window.alert("Src text: " + images[i].src + '\n Alt text: ' + images[i].alt + "\nDest text: " + images[i].attr("dest_src")); // used for testing.
		
		// Otherwise, if the image has a title that matches a blocked word...
		if (images[i].title.match(word_pat) != null)
		{
			// Replace the image with a blank white image.
			var matches = images[i].title.match(word_pat);
			images[i].src = chrome.extension.getURL("joseph'slogo2(transparent).png");
			for (var j = 0; j < matches.length; j++)
			{
				images[i].title = images[i].title.replace(matches[j], new Array(matches[j].length + 1).join('*'));
			}
			

			continue; // go to next image
		} // end else if
		
		
		// If the image URL has a match with a blocked word...
		else if (images[i].src.match(word_pat) != null)
		{
		
			// HAVING A PROBLEM WITH WORD MATCHING IN SRC ATTRIBUTE. PROBLEM SOLVED JANUARY 2013
			//window.alert("Replacing image step 1."); // used for testing.
			//window.alert("Image number: " + i); //used for testing.
			
			// Replace the image with a blank white image.
			images[i].src = chrome.extension.getURL("joseph'slogo2(transparent).png");

			continue; // Go to next image.
		} // end if
		
		
		
		// Otherwise if the image alternate text has a match with a blocked word...
		else if (images[i].alt.match(word_pat) != null)
		{
			//window.alert("Replacing image step 3."); // used for testing.
			//window.alert("Image number: " + i); //used for testing.
			
			// Replace the image with a blank white image.
			images[i].src = chrome.extension.getURL("joseph'slogo2(transparent).png"); // Doesn't work on all websites.
			

			continue; // go to next image
			
		} // end else if
		
		
		
		// Otherwise, if the image name has a match with a blocked word...
		else if (images[i].name.match(word_pat) != null)
		{
			//window.alert("Replacing image step 2."); // used for testing.
			//window.alert("Image number: " + i); //used for testing.
			
			// Replace the image with a blank white image.
			images[i].src = chrome.extension.getURL("joseph'slogo2(transparent).png");
			

			continue; // go to next image
		} // end else if
		
		
		// Otherwise, check if the image is the child of a link. (This is usually the case and is when the image itself is the link)
		// If the image is a link, and the link address or title contains a blocked word, block the image.
		else if (images[i].parentNode.nodeName == 'A')
		{

			if (images[i].parentNode.href.match(word_pat) != null)
			{
				images[i].src = chrome.extension.getURL("joseph'slogo2(transparent).png");
				continue;
			} // end if
			
			else if (images[i].parentNode.title.match(word_pat) != null)
			{
				images[i].src = chrome.extension.getURL("joseph'slogo2(transparent).png");
				continue;
			} // end else if
		} // end else if for parent node
		
	
		// This code will work for image scanning. Comment for test case 010 until you reach the end of this if block
		if (options.image_scanner == true)
		{			
			
			
			// If the image src is a DataURL, use it synchronously.
			if (images[i].src.match(/^data:/i) != null)
			{
				ImageHandler(images[i], images[i]);
			} // end sync if

			else // load it asynchronously
			{
				// Now create an xml request for the image so we can circumvent the cross-origin problem.
				var xhr = new XMLHttpRequest();
		
				xhr.open('GET', images[i].src) // Use an asynchronous get request on the image url.
				xhr._original = images[i];
				xhr.responseType = 'blob'; // Used so we can encode the binary into base64
				xhr.onreadystatechange = EventHandler; // Call EventHandler on a state change (will happen when the image is loaded.)
				xhr.send(); // Send the request.
			} // end async if
			
		} // end image scanner else
		// End working image scanner code.
			
	
		// If none of these things happen, continue to the next image.
		
	} // End for loop
} // end image filter function


function EventHandler()
{
	var xhr = this;
	// If the request is ready...
	if (xhr.readyState == 4)
	{
		// And we got an OK response...
		if (xhr.status == 200)
		{
			// Convert the blob to a DataURL, then load it into an img to extract pixel data from it.
			var reader = new FileReader(); // This should encode the image data as base64 to use with the PNG class.
			reader.addEventListener("loadend", function() {
				var image = new Image();
				image.onload = function() {
					ImageHandler(xhr._original, image);
				};
				image.src = reader.result;
			});
			reader.readAsDataURL(xhr.response);
		} // end if
	} // end if
}  // end Event Handler function


function ImageHandler(original, image)
{
	// Draw the image onto a canvas.
	var canvas = document.createElement('canvas');
	canvas.width = image.width;
	canvas.height = image.height;
	var ctx = canvas.getContext('2d');
	ctx.drawImage(image, 0, 0);
	var data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

	var skin_count = 0; // initialize a skin counter

	var limit = ((image.width * image.height)) * (options.scanner_sensitivity/100); // create a limit that tells us when to block the image.
	var block = false;

	for (var x = 0; x < data.length && !block; x += 4) // While we can still read data and we haven't blocked the image...
	{
		var R = data[x]; // first byte is for R
		var G = data[x+1]; // the next for G
		var B = data[x+2]; // and the final for B
		
		// Now RGB is the decimal representation of the RGB values of the pixel.
		if ((0.35 <= R/(R+G+B)) && (R/(R+G+B) <= 0.75) && (0.25 <= G/(R+G+B)) && (G/(R+G+B) <= 0.45) && (B/(R+G+B) <= 0.5))
		{
			skin_count++; // if we find a skin-colored pixel, increment the skin counter
			if (skin_count >= limit) // if we have surpassed the limit, set block to true (to break the while loop) and then block the image and remove it from the list of images we are scanning.
			{
				block = true;
				original.src = chrome.extension.getURL("joseph'slogo2(transparent).png");
				break;
			} // end if
		} // end if
			
	} // end for
	
} // end Event Handler function
