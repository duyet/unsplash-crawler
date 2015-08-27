var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var mongoose = require('mongoose');

var unsplash_url = 'http://unsplash.com';
var Images = mongoose.model('Images', { image_link: { type: String, unique: true }, author: String, author_link: String });

var record = 0;

var onPerPage = function(page, callback) {
	request(unsplash_url + '?page=' + page, function(error, response, body) {
		if(error) {
			callback(error);
		} else if (response.statusCode == 200) {
			$ = cheerio.load(body);
			var image = {};
			$('a', '.epsilon').each( function(index, element) {
				var text = $(this).text();
				if( text === 'Download') {
					image = {image_link: unsplash_url + $(this).attr('href')};
				} else if( text !== 'Subscribe' && text !== 'do whatever you want' ) {
					image.author = $(this).text();
					image.author_link = unsplash_url + $(this).attr('href');
					var s = new Images(image);
					s.save(function (err, model) {
						if (err) console.log("Error, skip: ", image.image_link);
						else console.log((record++) + ' - Saved ', model.image_link);
					});
				}
			});
			callback();
		} else {
			console.log(response.statusCode);
			callback(new Error('Could not request unsplash'));
		}
	});
};

var crawl = function(options, callback) {
	if(!options) {
		return callback(new Error('options are not defined'));
	}

	var start_page = options.start_page ? options.start_page : 1;
	var end_page = options.end_page ? options.end_page : 5;

	var db_name = options.db_name ? options.db_name : 'unsplash-collections';
	mongoose.connect('mongodb://localhost/' + db_name);

	var pages = [];
	for (var i = start_page; i <= end_page; i++) {
		pages.push(i);
	}

	async.each(pages, onPerPage, function (err) {
		callback(err);
	});
};

// Start 
crawl(require('./config'), function(err) {
	if (err) console.log(err);
});