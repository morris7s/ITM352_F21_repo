var express = require('express');
var app = express();
const fs = require('fs');
const { stringify } = require('querystring');

app.use(express.urlencoded({ extended: true }));

var products_array = require('./products.json');
products_array.forEach((prod, i) => { prod.total_available = 20 });
// ^ makes the supply for each product set at 20

// User info JSON file
var filename = './user_data.json';

// Using if just to check if the user data is present or not; taken from assignment 2 code examples
if (fs.existsSync(filename)) {
    var stats = fs.statSync(filename);
    var user_data_str = fs.readFileSync(filename, 'utf-8');
    var users_reg_data = JSON.parse(user_data_str);
    console.log(users_reg_data);
} else {
    console.log(filename + 'does not exist!');
    users_reg_data = {};
}

//Get request for products.js (it generates products_array from the JSON)
app.get("/products.js", function (request, response, next) {
    response.type('.js');
    var products_str = `var products_array = ${JSON.stringify(products_array)};`;
    response.send(products_str);
});

app.post("/purchase", function (request, response) {
    // Most of the code comes from assignment 1
    // Must check first if quantities are valid first before redirecting
    // Turn the Post request body into a variable
    let reqbody = request.body;
    var errors = {}; // assumes 0 errors at first
    errors['no_quantities'] = 'Hey you forgot to select some items!';  // error is automaticly assigned so when button is pressed this error comes
    for (i in products_array) {
        // breaks down the reqbody into the each quanitity of certain product v
        reqbodyi = reqbody['quantity' + i];

        // If invalid quantities inputed, there will be an alert for that product v
        // This 'if' is for individual products that have an invalid quantity amount 
        if (isNonNegInt(reqbodyi) == false) {
            delete errors['no_quantities'];
            errors['quantity' + i] = `Must enter valid amount for ${products_array[i].name}`;
        }
        // This 'if' is for after the initial test ^, after that, it looks for if theres enough products available
        if (reqbodyi > 0) {
            // if the amount passes isNonNegInt, it goes here because the value is above 0 (must be duh)
            // deletes the errors if quantities are good to go
            delete errors['no_quantities'];
            // From here, we must validate if we have enough of that product to sell
            if (reqbodyi > products_array[i].total_available) {
                errors['total_available' + i] = `${reqbodyi} of ${products_array[i].name} is not currently available. Only ${products_array[i].total_available} are available.`
            }
        }
    }
    // Redirect to login page with fsorm data in query string
    // Makes the req.body into variable obj params, must toString it to make a query string
    let params = new URLSearchParams(request.body);
    let paramsstring = params.toString();
    // Now we check for errors given to system beased off above 'tests', from here, if there are errors, we send the client back with the errors and the quanitities they inputed
    // If there are no errors, we send the client to the login page with the quantities. AND, I must correct the supply for products
    if (JSON.stringify(errors) === '{}') {
        // if theres 0 errors, we update the supply of products
        for (i in products_array) {
            products_array[i].total_available -= Number(reqbody['quantity' + i]);
        }
        // Now that quantities are valid and supply is updated, we take the client to the login page with the quantities in a qs
        response.redirect('./login.html?' + paramsstring);
    }
    // But, if there are errors, we make errors into an Obj to be put into the qs so the products display page can take the errors from the qs
    // Then, the client will be redirected to products display page with the quanitites plus the errors
    else {
        let errorsObj = { 'error': JSON.stringify(errors) };
        paramsstring += '&' + stringify(errorsObj);
        response.redirect("./products_display.html?" + paramsstring)
    }
});

app.get("/login", function (request, response) {
    // Give a simple login form
    // Added a button for those who need to register an account
    let params = new URLSearchParams(request.query);
    str = `
    <body>
    <form action="?${params.toString()}" method="POST">
    <input type="text" name="username" size="40" placeholder="enter username"><br />
    <input type="password" name="password" size="40" placeholder="enter password"><br />
    <input type="submit" value="Submit" id="submit"></form>
    <form action="/reg?${params.toString()}" method="POST">
    <input type="submit" value="Register an Account" id="submit">
    </form>
    </body>`;
    response.send(str);
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
    else if (typeof users_reg_data[username] == 'undefined') {
        errors['username'] = `Username not found`;
    }
    else if (typeof users_reg_data[username] != 'undefined') {
        if (users_reg_data[username].password != password) {
            errors['username'] = ``;
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


// Here to process ALL register requests
// Before i send the client to the register form, I must be able to keep the data in the qs after the login page which requires a POST to get the data and redirect to register page with the qs
// This is for when the client selects to register an account
app.post("/reg", function (request, response) {
    let params = new URLSearchParams(request.query);
    response.redirect('./register.html?' + params);
})


app.post("/register.html", function (request, response) {
    let params = new URLSearchParams(request.query);
    // process a simple register form
    // establishes blank errors so there is no undefined
    var errors = {};
    username = request.body.username.toLowerCase();
    // check is username taken
    if (typeof users_reg_data[username] != 'undefined') {
        errors['username'] = `Hey! ${username} is already registered!`;
    }
    if (request.body.password != request.body.repeat_password) {
        errors['password'] = `Repeat password not the same as password!`;
    }
    if (request.body.username == '') {
        errors['username'] = `You need to select a username!`;
    }
    if (request.body.password == '') {
        errors['password'] = `You need a password!`;
    }
    // if theres 0 errors, write data to reg file, and redirect to invoice
    // otherwise if there are errors, send client back to register with data and error
    if (Object.keys(errors).length == 0) {
        delete errors;
        users_reg_data[username] = {};
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;
        users_reg_data[username].name = request.body.fullname;
        fs.writeFileSync(filename, JSON.stringify(users_reg_data));
        console.log("Saved User: " + request.body.username);
        //response.send(`${username} has been registered.`);
        params.append('username', request.body.username);
        response.redirect(`./invoice.html?${params.toString()}`);
    } else {
        // code from help with proffesor
        // if theres errors, send input and error data back to login page plus qs for products info
        params.append('reg_data', JSON.stringify(request.body));
        params.append('reg_errors', JSON.stringify(errors));
        response.redirect(`./register.html?${params.toString()}`);
    }
});
// route all other GET requests to files in public 
app.use(express.static('./public'));

var listener = app.listen(8080, () => { console.log('server started listening on port ' + listener.address().port) });

// Functions taken from Assignment 1 posted down here 
// Borrowed and modified from Lab 12 order_page.html
function isNonNegInt(q, return_errors = false) {
    errors = []; // assume no errors at first
    if (q == '') q = 0; // handle blank inputs as if they are 0
    if (Number(q) != q) errors.push('<font color="red">Not a number!</font>'); // Check if string is a number value
    if (q < 0) errors.push('<font color="red">Negative value!</font>'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('<font color="red">Not an integer!</font>'); // Check that it is an integer
    return return_errors ? errors : (errors.length == 0);
}
