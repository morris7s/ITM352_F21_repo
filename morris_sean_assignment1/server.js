var products_array = require('./products.json');

var express = require('express');
var app = express();
const qs = require('querystring');

// Routing 

// monitor all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

// process purchase request (validate quantities, check quantity available)
// First thing I must do is validate data coming in from POST requests
app.use(express.urlencoded({"extended": true}));

app.post('/purchase', function (request, response, next) {
   // check if the quantites are valid
   // loop through all products to find any errors
   var errors = {};
   for(i in products_array) {
      // check if nonnegint

      // checkif quantity wanted is avalable

      // check if at least 1 quantity 

   }

   var qstring = qs.stringify(request.body);
   // if no errors, send to invoivce.html with quanity data in querystring, otherwsie back to products_display.html
   if(Object.keys(errors).length == 0) {
       response.redirect('./invoice.html?'+qstring);
   } else {
      response.redirect('./products_display.html?'+qstring);
   }
  
})

// route all other GET requests to files in public 
app.use(express.static('./public'));

app.get("/products.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products_array = ${JSON.stringify(products_array)};`;
   response.send(products_str);
});

// start server
app.listen(8080, () => console.log(`listening on port 8080`));

// Functions 
// Will use NonNegInt as a way to check whether quantities entered are valid (copied from labs)
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