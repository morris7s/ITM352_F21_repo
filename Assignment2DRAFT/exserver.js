var products_array = require('./products.json');
var express = require('express');
var app = express();
const qs = require('querystring');
const { type } = require('os');
// Taken from Lab13; Give each product the property (total_sold) to give the server an idea of how many was sold during uptime
products_array.forEach((prod, i) => { prod.total_sold = 20 });

// Routing 
// monitor all requests
app.all('*', function (request, response, next) {
   console.log(request.method + ' to ' + request.path);
   next();
});

//Get request for products.js (it generates products_array from the JSON)
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

// Got help from Prof and from classmates
app.post('/purchase', function (request, response, next) {
   // Turn the Post request body into a variable
   let reqbody = request.body;
   // Must check if the form input is 0 or not
   var errors = {}; // assumes 0 errors at first
   errors['no_quantities'] = 'Hey you forgot to select some items!';  // error is automaticly assigned so when button is pressed this error comes

   for (i in products_array) {
      reqbodyi = reqbody['quantity' + i]; // breaks down the reqbody into the each quanitity of certain product
      // If invalid quantities inputed, there will be an alert for that product
      
      if (isNonNegInt(reqbodyi) == false) {
         delete errors['no_quantities'];
         errors['quantity' + i] = `Must enter valid amount for ${products_array[i].name}`;
      
      }
      if (reqbodyi > 0) {
         // if the amount passes isNonNegInt, it goes here because the value is above 0 (must be duh)
         // deletes the errors if quantities are good to go
         delete errors['no_quantities'];
         // From here, we must validate if we have enough of that product to sell
         if (reqbodyi > products_array[i].total_sold) {
            errors['total_sold' + i] = `${reqbodyi} of ${products_array[i].name} is not currently available. Only ${products_array[i].total_sold} are available.`
         }
      }
   }

   // makes a querystring based on the POST request
   var qstring = qs.stringify(request.body);
   if (JSON.stringify(errors) === '{}') {
      // as the data is posted, we must remove the amount purchased from total quantity available
      for (i in products_array) {
         products_array[i].total_sold -= Number(reqbody['quantity' + i]);
      }
      // After that, if the quantities are valid, it will send the client to the invoice page
      response.redirect("./invoice.html?" + qstring);
   }   // if there is anything else (theres an error), we will give the client the errors
   else {
      let errorsObj = { 'error': JSON.stringify(errors) };
      qstring += '&' + qs.stringify(errorsObj);
      // after getting the errors into a querystring, we send the client back to the products page
      response.redirect("./products_display.html?" + qstring);
   }

});
