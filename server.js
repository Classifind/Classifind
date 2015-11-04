var express = require('express');
var app = express();

app.use(express.static(__dirname + "/public"));

var server = app.listen(5000, '0.0.0.0', function() {
  console.log('Listening on port %d', server.address().port);
});