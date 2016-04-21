var assert = require("assert");
var express = require("express");
var superagent = require("superagent");
var URL_ROOT = "http://localhost:3000";
var wagner = require("wagner-core");

describe('Test API', function() {
	var server;
	var categories;
	var user;
	var products;
	var Category;
	var Product;
	var User;
	var app = express();

	//bootstrap server
	before(function(){
		

		models = require('./models')(wagner);
		User	= models.User;
		app.use(function(req, res, next) {
			User.findOne({}, function(error, user) {
				assert.ifError(error);
				req.user = user;
				next();
			});
		});
		app.use(require('./api')(wagner));
		Category = models.Category;
		Product = models.Product;
		


		server = app.listen(3000);
	});

	after(function() {
		server.close();
	});

	beforeEach(function(done) {
		categories = [
			{_id: 'Electronic'},
			{_id: 'Phones', parent: 'Electronic'},
			{_id: 'Laptops', parent: 'Electronic'},
			{_id: 'Bacon'}
		];

		products = [
			{
				name: 'LG G2',
				category:{_id: 'Phones', ancestors: ['Electronic', 'Phones']},
				price:{
					amount: 301,
					currency: 'USD'
				}
			},
			{
				name: 'Asus',
				category:{_id:'Laptops', ancestors:["Electronic", "Laptops"]},
				price:{
					amount: 300,
					currency: 'USD'
				}
			}
		];


		user = [{
			profile: {
				username: "vforv",
				picture: "http://somepic.com/test.jpg"
			},
			data: {
				oauth: 'invalid',
				cart: []
			}
		}
		];

		User.create(user,function(error, user) {
			assert.ifError(error);
		});
		
		Product.remove({}, function(error) {
			assert.ifError(error);
		});
		Category.remove({}, function(error) {
			assert.ifError(error);
			done();
		});
	});

	afterEach(function(done){
		User.remove({}, function(error) {
			assert.ifError(error);
			done();
		});
	});


	it('Test get category by id /', function(done) {
		Category.create({_id: 'Electroni'}, function(error,doc) {

			assert.ifError(error);
			var url = URL_ROOT + '/category/id/Electroni';

			superagent.get(url,function(error,res) {
				assert.ifError(error);
				var result;

				assert.doesNotThrow(function() {
					result = JSON.parse(res.text);
				});

				assert.ok(result.category);
				assert.equal(result.category._id,"Electroni");
				done();
			});
		});
	});


	it('Test get parent', function(done) {
		var parent = [
					{_id: 'Phones', parent: 'Electronic'},
					{_id: 'PCs', parent: 'Electronic'}]
	  Category.create(parent, function(error, doc){
	   		assert.ifError(error);
	   		var url = URL_ROOT + '/category/parent/Electronic';

	   		superagent.get(url, function(error, res){
	   			assert.ifError(error);
	   			var	result;

	   			assert.doesNotThrow(function(){
	   				result = JSON.parse(res.text);
	   			});

	   			assert.equal(result.categories.length, 2);
	   			assert.equal(result.categories[0]._id, 'PCs');
	   			done();
	   		});
	  });
	});


	it('Test product load by category id', function(done) {
		var product = {
			name: 'LG G2',
			_id: '41224d776a326fb40f000001',
			price: {
				amount: 300,
				currency: 'USD'
			}
		};

		Product.create(product,function(error,doc) {
			assert.ifError(error);
			var url = URL_ROOT + '/product/id/41224d776a326fb40f000001';

			superagent.get(url, function(error, res) {
				assert.ifError(error);
				var result;
				assert.doesNotThrow(function() {
					result = JSON.parse(res.text);
				});

				assert.equal(result.product.name, 'LG G2');

				done();
			})
		});
	});


	it("Test find product by category id", function(done){


		Category.create(categories, function(error, categories){

			assert.ifError(error);

			Product.create(products, function(error,products) {
				assert.ifError(error);

				var url = URL_ROOT + "/product/category/Electronic";

				superagent.get(url, function(error, res) {
					assert.ifError(error);
					var result;

					assert.doesNotThrow(function() {
						result = JSON.parse(res.text)
					});
					assert.equal(result.products[0].name,'LG G2');
					assert.equal(result.products[1].name,'Asus');
					
				});

				var url1 = URL_ROOT + "/product/category/Electronic?price=1";

				superagent.get(url1, function(error, res) {
					assert.ifError(error);
					var result;

					assert.doesNotThrow(function() {
						result = JSON.parse(res.text)
					});
					assert.equal(result.products[1].name,'LG G2');
					assert.equal(result.products[0].name,'Asus');
					done();
				});
			});
		});
	});


	//CART TEST
	it("Check if cart updated", function(done) {
		

		Category.create(categories, function(error, category){
			assert.ifError(error);

			Product.create(products, function(error, product){
				assert.ifError(error);
				var url = URL_ROOT + "/me/cart";
				var PRODUCT_ID = product[0]._id;

				superagent
				.put(url)
				.send({
					data: {
						cart: [{product: PRODUCT_ID, quantity: 1}]
					}
				})
				.end(function(error,res){
					assert.ifError(error);
					User.findOne({},function(error, user) {
						assert.ifError(error);

						assert.equal(PRODUCT_ID, user.data.cart[0].product.toString());
						done();
					});
				});
			});
		});
	});


	it("Check if pruduct updated inside cart", function(done){
			Category.create(categories, function(error, category){
			assert.ifError(error);
			
			User.findOne({}, function(error, user) {
				assert.ifError(error);
					Product.create(products, function(error, product){
						assert.ifError(error);
						var PRODUCT_ID = product[0]._id;
						user.data.cart = [{product: PRODUCT_ID, quantity: 1}];

						user.save(function(error) {
							assert.ifError(error);
							var url = URL_ROOT + "/me";
							superagent
							.get(url, function(error,res){
								assert.ifError(error);
								var result;
								assert.doesNotThrow(function(){
									result = JSON.parse(res.text).user;
								});

								assert.equal(result.data.cart[0].product.name, 'LG G2');
								done();
							})
						});
						});
			});
		});
	});
});


