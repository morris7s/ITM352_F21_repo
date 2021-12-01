var express = require('express');
var app = express();
const fs = require('fs');
const { stringify } = require('querystring');

app.use(express.urlencoded({ extended: true }));

var products_array = require('./products.json');
products_array.forEach((prod, i) => { prod.total_sold = 20 });
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
            if (reqbodyi > products_array[i].total_sold) {
                errors['total_sold' + i] = `${reqbodyi} of ${products_array[i].name} is not currently available. Only ${products_array[i].total_sold} are available.`
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
            products_array[i].total_sold -= Number(reqbody['quantity' + i]);
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

/* app.post("/login.html", function (request, response) {
    let params = new URLSearchParams(request.query);
    var errors = {}; // assumes 0 errors at first
    let paramsstring = params.toString();
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    the_username = request.body['username'].toLowerCase();
    the_password = request.body['password'];
    console.log(params);
    if (typeof users_reg_data[the_username] != 'undefined') {
        if (users_reg_data[the_username].password == the_password) {
            params.append('username', the_username);
            response.redirect(`./invoice.html?${params.toString()}`);
            return;
        } else {
            response.send(`Wrong password!`);
        }
        return;
    } else {
        let errorsObj = { 'error': JSON.stringify(errors) };
        paramsstring += '&' + stringify(errorsObj);
        response.redirect("./login.html?" + paramsstring)
    }
}); */

app.post("/login.html", function (request, response) {
    let params = new URLSearchParams(request.query);
    let paramsstring = params.toString();
    var errors = {}; // assumes 0 errors at first
    the_username = request.body['username'].toLowerCase();
    the_password = request.body['password'];
    if (request.body['username'] == "" || request.body['password'] == "") {
        //response.send('must fill in the form!');
        errors['blank_form'] = `Please enter username and password`;
    }
    else if(typeof users_reg_data[the_username] == 'undefined'){
        errors['wrong_username'] = `Username not found`;
    }
    else if (typeof users_reg_data[the_username] != 'undefined') {
        if(users_reg_data[the_username].password != the_password){
            errors['wrong_password'] = `Password incorrect`;
        }
    }
    // Now that I generated errors for certain login failures, I need a way to send it back to the login page to show the error and let client re-enter user and pass
    // BUT, if there is an error, we take that error, add it to the qs, and then redirect back to login with said errors 
    if (JSON.stringify(errors) === '{}') {
        // if there are 0 errors, meaning login works , we send client to invoice with the username in the query
        params.append('username', the_username);
        response.redirect(`./invoice.html?${params.toString()}`);
    } else {
        let errorsObj = { 'error': JSON.stringify(errors) };
        paramsstring += '&' + stringify(errorsObj);
        response.redirect("./login.html?" + paramsstring)
    }
});


// Here to process ALL register requests
// Before i send the client to the register form, I must be able to keep the data in the qs after the login page which requires a POST to get the data and redirect to register page with the qs
// This is for when the client selects to register an account
app.post("/reg", function (request, response) {
    let params = new URLSearchParams(request.query);
    response.redirect('./register?' + params);
})
var errors = {}; // keep errors on server to share with registration page
app.get("/register", function (request, response) {
    let params = new URLSearchParams(request.query);
    // Give a simple register form
    str = `
    <body>
    <form action="?${params.toString()}" method="POST">
    <input type="text" name="username" size="40" placeholder="enter username" > 
    ${(typeof errors['no_username'] != 'undefined') ? errors['no_username'] : ''}
    ${(typeof errors['username_taken'] != 'undefined') ? errors['username_taken'] : ''}
    <br />
    <input type="password" name="password" size="40" placeholder="enter password"><br />
    <input type="password" name="repeat_password" size="40" placeholder="enter password again">
    ${(typeof errors['password_mismatch'] != 'undefined') ? errors['password_mismatch'] : ''}
    <br />
    <input type="email" name="email" size="40" placeholder="enter email"><br />
    <input type="submit" value="Submit" id="submit">
    </form>
    </body>
        `;
    response.send(str);

});


app.post("/register", function (request, response) {
    let params = new URLSearchParams(request.query);
    // process a simple register form
    username = request.body.username.toLowerCase();
    // check is username taken
    if (typeof users_reg_data[username] != 'undefined') {
        errors['username_taken'] = `Hey! ${username} is already registered!`;
    }
    if (request.body.password != request.body.repeat_password) {
        errors['password_mismatch'] = `Repeat password not the same as password!`;
    }
    if (request.body.username == '') {
        errors['no_username'] = `You need to select a username!`;
    }
    if (request.body.password == '') {
        errors['no_password'] = `You need a password!`;
    }
    if (Object.keys(errors).length == 0) {
        let errors = [];
        users_reg_data[username] = {};
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;
        fs.writeFileSync(filename, JSON.stringify(users_reg_data));
        console.log("Saved User: " + request.body.username);
        //response.send(`${username} has been registered.`);
        params.append('username', request.body.username);
        params.append('register', true);
        response.redirect(`./invoice.html?${params.toString()}`);
    } else {
        response.redirect(`./register?${params.toString()}`);
        let errors = [];
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
