var Stripe = require('stripe');

module.exports = function(wagner) {
    var stripe = Stripe("sk_test_CbWnA1OYhmGolBBJ6vL61dPT");
    
    wagner.factory('Stripe', function() {
        return stripe;
    });
    
    return {
        Stripe: stripe
    };
};