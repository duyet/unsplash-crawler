var cheerio = require('cheerio');
var request = require('request');
var async = require('async');
var mongoose = require('mongoose');

var unsplash_url = 'https://google.com';
var Images = mongoose.model('Images', {
    image_link: {
        type: String,
        unique: true
    },
    author: String,
    author_link: String
});

var record = 0;

var onPerPage = function(page, callback) {
	request(unsplash_url + '?page=' + page, function(error, response, body) {
        if (error) {
            callback(error);
        } else if (response.statusCode == 200) {
            $ = cheerio.load(body);
            var image = {};
            $('a', '.epsilon').each(function(index, element) {
                var text = $(this).text();
                if (text === 'Download') {
                    image = {
                        image_link: unsplash_url + $(this).attr('href')
                    };
                } else if (text !== 'Subscribe' && text !== 'do whatever you want') {
                    image.author = $(this).text();
                    image.author_link = unsplash_url + $(this).attr('href');
                    saveImage(image);
                }
            });
            callback();
        } else {
            console.log(response.statusCode);
            callback(new Error('Could not request unsplash'));
        }
    });
};

var saveImage = function(image) {
    saveToDb(image);
};

var saveToDb = function(image) {
	if (!image) return;
	var s = new Images(image);
    s.save(function(err, model) {
        if (err) console.log("Error, skip: ", image.image_link);
        else console.log((record++) + ' - Saved ', model.image_link);
    });
};

var saveToDisk = function(uri, folder, callback) {
	request.head(uri, function(err, res, body) {
        var filename = folder_name + '/' +res.headers['x-imgix-request-id'] + '.' + mime.extension(res.headers['content-type']);
        request(uri).pipe(fs.createWriteStream(filename)).on('close', function() { callback(filename); });
    });
};

var crawl = function(options, callback) {
    if (!options) {
        return callback(new Error('options are not defined'));
    }

    var start_page = options.start_page ? options.start_page : 1;
    var end_page = options.end_page ? options.end_page : 5;

    if (options.save_to == 'db') {
        var db_name = options.db_name ? options.db_name : 'unsplash-collections';
        mongoose.connect('mongodb://localhost/' + db_name);
    } else if (options.save_to == 'disk') {
    	saveImage = function(image) { saveToDisk(image, options.folder_name, function(filename) { console.log('Saved ' + filename) }); };	
    }


    var pages = [];
    for (var i = start_page; i <= end_page; i++) {
        pages.push(i);
    }

    async.each(pages, onPerPage, function(err) {
        callback(err);
    });
};

// Start 
crawl(require('./config'), function(err) {
    if (err) console.log(err);
});
