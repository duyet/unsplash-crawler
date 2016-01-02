var request = require('request');
var fs = require('fs');
var mime = require('mime');

var saveToDisk = function(uri, filename, callback) {
    request.head(uri, function(err, res, body) {
        var filename = res.headers['x-imgix-request-id'] + '.' + mime.extension(res.headers['content-type']);
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

saveToDisk('https://unsplash.com/photos/n3t4fIuVzLA/download');