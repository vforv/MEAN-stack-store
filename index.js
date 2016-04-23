var express = require("express");
var cors = require('cors');
var wagner = require("wagner-core");
var app = express();

app.use(cors());

require ('./models')(wagner);
require('./dependencies')(wagner);


wagner.invoke(require('./auth'), {app: app});

app.use('/api/v1', require("./api")(wagner));


app.listen(3000, function() {
	console.log("Server Started!!!");
});