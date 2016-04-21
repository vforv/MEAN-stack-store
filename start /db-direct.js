var mongodb = require("mongodb");

var uri = "mongodb://localhost:27017/example";
mongodb.MongoClient.connect(uri, function(error, db){
	if (error) {
		console.log(error);
		process.exit(1);
	}
   	
	var doc = {
		title: "Jaws",
		year: 1939,
		rating: 'PG',
		ratings: {
			ibm: 80
		}
	}

	//DODAJ NOVU KOLEKCIJU 
	db.collection("sample").insert(doc, function(error, result){
		if(error) {
			console.log(error);
			process.exit(1);
		}
	});


	//VRATI REZULTATE GDJE JE GODINA 1939 I REJTING VECI OD 70
	var query = {year: 1939, 'ratings.ibm': {'$gte': 70}};

	db.collection('sample').find(query).toArray(function(error, result){
		if(error) {
			console.log(error);
			process.exit(1);
		}

		console.log(result);
		process.exit(1);
	});
});
