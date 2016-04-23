var express = require("express");
var status = require("http-status");
var bodyParser = require("body-parser");
var _ = require = require("underscore");

module.exports = function (wagner) {
    api = express.Router();
    api.use(bodyParser.json());



    //CARD API
    api.put('/me/cart', wagner.invoke(function (User) {
        return function (req, res) {
            try {
                var cart = req.body.data.cart;
            } catch (error) {
                res
                        .status(status.BAD_REQUEST)
                        .json({error: 'No card specified!'});
            }


            req.user.data.cart = cart;

            req.user.save(function (error, user) {
                if (error) {
                    return res
                            .status(status.INTERNAL_SERVER_ERROR)
                            .json({error: error.toString()});
                }

                return res
                        .json({user: user});

            });
        }
    }));

    api.get('/me', function (req, res) {
        if (!req.user) {
            return res
                    .status(status.UNAUTHORIZED)
                    .json({error: 'Not logged in.'});
        }

        req.user.populate({
            path: 'data.cart.product',
            model: 'Product'
        }, handleOne.bind(null, 'user', res));
    })

    //CATEGORY API
    api.get("/category/id/:id", wagner.invoke(function (Category) {
        return function (req, res) {
            Category.findOne({_id: req.params.id}, function (error, category) {

                if (error) {
                    return res
                            .status(status.INTERNAL_SERVER_ERROR)
                            .json({error: error.toString()});
                }

                if (!category) {
                    return res
                            .status(status.NOT_FOUND)
                            .json({error: "Not found"});
                }

                res.json({category: category});
            });
        }
    }));

    api.get('/category/parent/:id', wagner.invoke(function (Category) {
        return function (req, res) {
            Category
                    .find({parent: req.params.id})
                    .sort({_id: 1})
                    .exec(function (error, categories) {
                        if (error) {
                            return res
                                    .status(status.INTERNAL_SERVER_ERROR)
                                    .json({error: error.toString()});
                        }
                        res.json({categories: categories});
                    })
        }
    }));


    //PRODUCT ROUTES
    api.get("/product/id/:id", wagner.invoke(function (Product) {
        return function (req, res) {
            Product.findOne({_id: req.params.id},
            handleOne.bind(null, 'product', res));
        };
    }));

    api.get('/product/category/:id', wagner.invoke(function (Product) {
        return function (req, res) {
            var sort = {name: 1};

            if (req.query.price === "1") {
                sort = {'internal.approximatePriceUSD': 1}
            } else {
                sort = {'internal.approximatePriceUSD': -1}
            }

            Product
                    .find({"category.ancestors": req.params.id})
                    .sort(sort)
                    .exec(handleMany.bind(null, 'products', res));
        }
    }));

    //STRIPE CHACK OUT
    api.post('/checkout', wagner.invoke(function (User, Stripe) {
        return function (req, res) {
            if (!req.user) {
                return res
                        .status(status.UNAUTHORIZED)
                        .json({error: 'Not logged in.'});
            }

            req.user.populate({path: 'data.cart.product', model: 'Product'}, function (error, user) {

                var totalCostUSD = 0;

                _.each(user.data.cart, function (item) {
                    totalCostUSD += item.product.internal.approximatePriceUSD * item.quantity;
                });
//                console.log(Math.ceil(totalCostUSD * 100));

                Stripe.charges.create(
                        {
                            amount: Math.ceil(totalCostUSD * 100),
                            currency: 'usd',
                            card: req.body.stripeToken,
                            description: 'Example Charge'
                        })
                        .then(function (charge) {
                            console.log(charge);
                            req.user.data.cart = [];

                            req.user.save(function () {
                                return res.json({id: charge.id});
                            });
                        })
                        .catch(function (err) {
                            if (err && err.type === "StripeCardError") {
                                return res
                                        .status(status.BAD_REQUEST)
                                        .json({error: err.toString()});
                            }

                            console.log(err);
                            return res
                                    .status(status.INTERNAL_SERVER_ERROR)
                                    .json({error: err.toString()});

                        })
                        .finally(function (err) {
                            console.log(err);
                        });
            });


        };

    }));
    
    api.get("/product/text/:query", wagner.invoke(function(Product){
		return function(req, res) {
			Product
				.find({
					$text: {$search : req.params.query}
				},
				{
					score: {$meta: 'textScore'}
				})
				.sort({score:{$meta: 'textScore'}})
				.limit(20)
				.exec(handleMany.bind(null, 'products', res));
		};
	}));

    return api;
};


function handleOne(property, res, error, result) {
    if (error) {
        return res
                .status(status.INTERNAL_SERVER_ERROR)
                .json({error: error.toString()})
    }

    if (!result) {
        return res
                .status(status.NOT_FOUND)
                .json({error: 'Not found'});
    }

    var json = {};
    json[property] = result;
    res.json(json);


}


function handleMany(property, res, error, result) {
    if (error) {
        return res
                .status(status.INTERNAL_SERVER_ERROR)
                .json({error: error.toString()})
    }

    var json = {};
    json[property] = result;
    res.json(json);
}