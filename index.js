var express = require("express");

var wagner = require("wagner-core");
var app = express();

require ('./models')(wagner);

wagner.invoke(require('./auth'), {app: app});

app.use('/api/v1', require("./api")(wagner));


app.listen(3000, function() {
	console.log("Server Started!!!");
});