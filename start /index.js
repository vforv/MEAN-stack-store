var mongoose = require("mongoose");
var schema = require("./db-mongoose");


mongoose.connect('mongodb://localhost:27017/test');


var User = mongoose.model('User',schema, 'users');

var user = new User({
  name: "Vladmir Djukic",
  email: "vladimirdjukic90@gmail.com"
});

user.save(function(error) {
	if (error) {
 	 console.log(error);
 	 process.exit(1);
	}

	User.find({name: "Vladmir Djukic"}, function(error, data) {
		console.log(data);
		process.exit(1);
	})
})