console.log(`you can do it`);
var express = require('express');
var app = express();

var session = require('express-session');
const { connect } = require('http2');
var products_data = require('./products.json');


app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));

app.all('*', function (request, response, next) {
    console.log(`Got a ${request.method} to path ${request.path}`);
    // need to initialize an object to store the cart in the session. We do it when there is any request so that we don't have to check it exists
    // anytime it's used
    if (typeof request.session.cart == 'undefined') { request.session.cart = {}; }
    next();
});

app.post("/get_products_data", function (request, response) {
    response.json(products_data);
});

app.post("/products_display.html", function (request, response){
    // this is used to redirect back to products display by reattaching the query that has the product key in it
    let params = new URLSearchParams(request.query);
    let paramsstring = params.toString();
    //using this console to see what the req body is
    console.log(request.body);
    // This must take the quanitities and put it into the cart based on the product_key
    // Turn POST request into a variable
    let reqbody = request.body;
    let brand = request.body['products_key'];
    // use a for function to get the quantities for specific brand
    for (i in products_data[brand]) {
        reqbodyi = reqbody['quantity' + i];
        let quantity_str = JSON.array(reqbodyi);
        console.log(quantity_str);
        if (reqbodyi > 0) {
           request.session.cart[brand] = '';
        }
    };
    // Redirect user back to products display after adding items to cart
    response.redirect(`./products_display.html?${paramsstring}`);
})


app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));