var products_array = require('./products.json');
var express = require('express');
var app = express();
const qs = require('querystring');
const { type } = require('os');
// Taken from Lab13; Give each product the property (total_sold) to give the server an idea of how many was sold during uptime
products_array.forEach((prod, i) => { prod.total_sold = 0 });

// Routing 
// monitor all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

app.get("/products.js", function (request, response, next) {
   response.type('.js');
   var products_str = `var products_array = ${JSON.stringify(products_array)};`;
   response.send(products_str);
});

// Borrowed and modified from Lab 12 order_page.html
function isNonNegInt(q, return_errors = false) {
   errors = []; // assume no errors at first
   if (q == '') q = 0; // handle blank inputs as if they are 0
   if (Number(q) != q) errors.push('<font color="red">Not a number!</font>'); // Check if string is a number value
   if (q < 0) errors.push('<font color="red">Negative value!</font>'); // Check if it is non-negative
   if (parseInt(q) != q) errors.push('<font color="red">Not an integer!</font>'); // Check that it is an integer
   return return_errors ? errors : (errors.length == 0);
}

// process purchase request (validate quantities, check quantity available)
// First thing I must do is validate data coming in from POST requests
app.use(express.urlencoded({ "extended": true }));

app.post('/purchase', function (request, response, next) {
   // check if the quantites are valid
   // loop through all products to find any errors
   var errors = {}; // assume no errors at first
   var qty = request.body;
   console.log(qty);
   console.log(typeof qty);
   let has_errors = true; // makes has_errors blank for now, est. the var
   // found in A1 workshop; used for 
   for (i in products_array) {
      let q = request.body[`quantity${i}`]
      let name = products_array[i].name;
      let name_price = products_array[i].price;

      // check if qtty is nonnegint
      if (isNonNegInt(q) == false) { // if the quantity isn't true, it returns the error
         errors[`quantity${i}`] = `Must enter valid quantities for ${name}`; // returns error to the specific product
      }
      // check if quantity wanted is avalable

      // check if  qtty is at least 1 quantity 
      if (q > 0) {
         has_quantities = true;
      }
   }
   // if has_quantities = false, generate an error
   if (has_quantities == false) {
      errors['no quantities'] = "You need to select some items";
   }

   var qstring = qs.stringify(request.body);
   // if no errors, send to invoivce.html with quanity data in querystring, otherwsie back to products_display.html
   if (Object.keys(errors).length == 0) {
      response.redirect('./invoice.html?' + qstring);

   } else {
      response.redirect('./products_display.html?' + qstring);
   }

})

// route all other GET requests to files in public 
app.use(express.static('./public'));

// start server
app.listen(8080, () => console.log(`listening on port 8080`));