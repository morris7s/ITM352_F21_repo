console.log(`you can do it`);
var express = require('express');
var app = express();
const fs = require('fs');

var session = require('express-session');
const { connect } = require('http2');
var products_data = require('./products.json');


app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));

// 3 codes below taken from assignment 2, just takes the user_reg_data and gives it to the server
// gets the user data and puts that into a variable to use to give to pages
var all_user_data = require('./user_data.json');

// User info JSON file
var filename = './user_data.json';

// Using if just to check if the user data is present or not; taken from assignment 2 code examples
if (fs.existsSync(filename)) {
    var stats = fs.statSync(filename);
    var user_data_str = fs.readFileSync(filename, 'utf-8');
    var users_reg_data = JSON.parse(user_data_str);
    console.log(`User data exists!`);
    //console.log(users_reg_data);
} else {
    console.log(filename + 'does not exist!');
    users_reg_data = {};
}

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
        let quantity_str = reqbodyi;
        console.log(quantity_str);
        if (reqbodyi > 0) {
           request.session.cart[brand] = '';
        }
    };
    // Redirect user back to products display after adding items to cart
    response.redirect(`./products_display.html?${paramsstring}`);
})

// Taken from assignment 3 code examples
// This is for when a user wants to add items to the cart from the products_display page
// This will take the brand from the qs as well as the quantities
// Then it will be stored in the cart
// This will then redirect the user back to the products display page
// I want to add an alert or something to show the user they added their items to the cart
app.post("/add_to_cart", function (request, response) {
    // code below got inspiration from Brandon Marcos
    console.log(request.body);
    let params = new URLSearchParams(request.body);
    // turn request body into usable variables
    var product_key = request.body['products_key'];
    var quantity_submit = request.body['quantity'];

    // assume 0 errors
    var errors ={};

    // now to validate the submitted quantities
    // This checks for whether it passes the isNonNegInt or if we have quantities available or not
    for (i in products_data[product_key]) {
        let q = quantity_submit[i];
        if (isNonNegInt(q) == false) {
            errors[`quantity[${i}]`] = `${q} is not a valid quantity TEST`;
        } else {
            if (q > products_data[product_key][i]['quantity_available']) {
                errors[`quantity[${i}]`] = `We dont have that many TEST`;
            }
        }
    }

    // if there arent any errors, then we add it to the cart via sessions
    // if there are errors, we send them back to the product page with their errors and quantity data
    // gonna be using the request body as the data to send back to and add errors into it
    if (Object.keys(errors).length === 0) {
        if (typeof request.session.cart == 'undefined') {
            // establishes a cart if there isn't one in the session
            request.session.cart = {};
        }
        if (typeof request.session.cart[product_key] == 'undefined') {
            // this creates an array in the cart based on the product_key and fills the entirety of it with 0
            request.session.cart[product_key] = new Array(quantity_submit.length).fill(0);
        }
        for (i in request.session.cart[product_key]) {
            // this adds the submitted quantities to the array based on the product key
            request.session.cart[product_key][i] += Number(quantity_submit[i]);
        }
    } else {
        // this is for when theres errors, takes the qty data and error data and puts it into the params and sends it back
        // this code comes from my assignment 2, when I got help from proffesor Port
        params.append('qty_data', JSON.stringify(request.body));
        params.append('qty_errors', JSON.stringify(errors));
    }
    console.log('Cart Info:' + request.session.cart);
    response.redirect('./products_display.html?' + `${params.toString()}`);
});

// Taken from assignment 3 code examples
// If there's a get request to retreive cart info '/get_cart', this will respond with the json data
app.get("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

app.post("/login.html", function (request, response) {
    let params = new URLSearchParams(request.query);
    let paramsstring = params.toString();
    var errors = {}; // assumes 0 errors at first
    username = request.body['username'].toLowerCase();
    password = request.body['password'];
    //if username isn't filled out, tell them to enter a username
    if (request.body['username'] == "") {
        errors['username'] = `Please enter your username`;
    }
    if (request.body['password'] == "") {
        errors['password'] = `Please enter your password`;
    }
    if (typeof users_reg_data[username] == 'undefined') {
        errors['username'] = `Username not found`;
        errors['password'] = ` `;
    }
    if (typeof users_reg_data[username] != 'undefined') {
        if (users_reg_data[username].password != password) {
            errors['username'] = ` `;
            errors['password'] = `Password incorrect`;
        }
    }
    // Now that I generated errors for certain login failures, I need a way to send it back to the login page to show the error and let client re-enter user and pass
    // BUT, if there is an error, we take that error, add it to the qs, and then redirect back to login with said errors 
    if (Object.keys(errors).length == 0) {
        // if there are 0 errors, meaning login works , we send client to invoice with the username in the query
        delete errors;
        params.append('username', username);
        response.redirect(`./invoice.html?${params.toString()}`);
    } else {
        // if theres errors, send input and error data back to login page plus qs for products info
        params.append('login_data', JSON.stringify(request.body));
        params.append('login_errors', JSON.stringify(errors));
        response.redirect(`./login.html?${params.toString()}`);
    }
});

app.use(express.static('./public'));
app.listen(8080, () => console.log(`listening on port 8080`));

// Function used to check incoming quantities are NonNegInt
function isNonNegInt(q, return_errors = false) {
    errors = []; // assume no errors at first
    if (q == '') q = 0; // handle blank inputs as if they are 0
    if (Number(q) != q) errors.push('<font color="red">Not a number!</font>'); // Check if string is a number value
    if (q < 0) errors.push('<font color="red">Negative value!</font>'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('<font color="red">Not an integer!</font>'); // Check that it is an integer
    return return_errors ? errors : (errors.length == 0);
}