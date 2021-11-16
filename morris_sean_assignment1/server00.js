var express = require('express');
var app = express();

app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path + ' query string ' + JSON.stringify(request.query));
    next();
});

app.use(express.urlencoded({ extended: true }));


var products = require('./products.json');
products.forEach( (prod,i) => {prod.total_sold = 0});

app.get("/products_data.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products = ${JSON.stringify(products)};`;
    response.send(products_str);
});

app.post('/process_form', function (request, response, next) {
    let name = products[0]['name'];
    let name_price = products[0]['price'];
    console.log(request.body);
    var q = request.body['quantity_textbox'];
    if (typeof q != 'undefined') {
        if (isNonNegInt(q)) {
            products[0].total_sold += Number(q);
            response.send(`<h2>Thank you for purchasing ${q} ${name}. Your total is \$${q * name_price}!</h2>`);
        } else {
            response.send(`Error: ${q} is not a quantity. Go back and fix it`)
        }

    }
    next();
});

app.use(express.static('./public'));

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback

app.get('/test', function (request, response) {
    response.send('Does /test work? If so, you should see me ...' + request.body);
    next();
});

function isNonNegInt(q, returnErrors = false) {
    // checks if a string 'q' is a non-neg integer. If returnErrors is true, the array of errors is returned
    //Other returns true if q is a non-neg int.
    errors = []; // assume no errors at first
    if (q == '') q = 0;
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    else {
        if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
        if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer
    }
    return returnErrors ? errors : (errors.length == 0);
}