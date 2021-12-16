/* 
Author: Sean Morris
Date: 15 December 2021
Desc.:
    This is my server. It handles all requests on port 8080.
    Some major features includes:
    Displaying 4 different brands of products 
    The ability to add product quantities to a cart that's stored in the session data
    Track who logged in/registered
    Able to modify quantities of a product in the cart itself
    Server checks for a username to see if the user has logged in or not
    Might've forgot some stuff but my video should show that...
P.S.:
    Most of the code here came from my server.js in assignment 2
    Only modified it to work with sessions and cookies
    Along with the addition of a cart page, and the required checks for user data
    Need to mention that classmate Brandon Marcos was a source of inspiration for some of the code here
*/
console.log(`you can do it`);
var express = require('express');
var app = express();
const fs = require('fs');

var session = require('express-session');
const { connect } = require('http2');
var products_data = require('./products.json');


app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: "MySecretKey", resave: true, saveUninitialized: true }));

// Taken from https://mailtrap.io/blog/nodemailer-gmail/
// this is requires the nodemailer package
const nodemailer = require('nodemailer');

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
    var errors = {};

    // now to validate the submitted quantities
    // This checks for whether it passes the isNonNegInt or if we have quantities available or not
    for (i in products_data[product_key]) {
        let q = quantity_submit[i];
        if (isNonNegInt(q) == false) {
            errors[`quantity[${i}]`] = `${q} is not a valid quantity!`;
        } else {
            if (q > products_data[product_key][i]['quantity_available']) {
                errors[`quantity[${i}]`] = `We don't ${q} in stock!`;
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
    console.log(request.session);
    response.redirect('./products_display.html?' + `${params.toString()}`);
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

    // Now that the errors are generated, if there ARE errors:
    // Get the errors, put them in the qs and return back to login with the errors
    // If there are NO errors, we take the username, full name and email and put them into the session
    if (Object.keys(errors).length == 0) {
        // if there are 0 errors, meaning login works , we take the username, full name and email and put them into the session
        delete errors;
        request.session['username'] = username;
        request.session['email'] = all_user_data[username].email;
        request.session['full_name'] = all_user_data[username].name;
        console.log(request.session);
        response.redirect(`./products_display.html?products_key=jordan`)
    } else {
        // if theres errors, send input and error data back to login page plus qs for products info
        params.append('login_data', JSON.stringify(request.body));
        params.append('login_errors', JSON.stringify(errors));
        response.redirect(`./login.html?${params.toString()}`);
    }
});

// this is to transfer from login page to register page
// Only doing this because I am too lazy to change other things and just roll with what I have from assignment 2
app.post("/reg", function (request, response) {
    let params = new URLSearchParams(request.query);
    response.redirect('./register.html?' + params);
})

// this is to process all register info coming in 
// If there are 0 errors, just redirect to product display page
// If there ARE errors, send back to register page with errors
// a lot of this is from assignment 2, just being modifying some parts
app.post("/register.html", function (request, response) {
    let params = new URLSearchParams(request.query);
    console.log(request.body);
    // process a simple register form
    // establishes blank errors so there is no undefined
    // alot of this code comes from RegEx, Brandon Jude from class, and https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php - found from assignment2 tutorial
    var errors = {};
    // establish req.body inputs as variables
    username = request.body['username'].toLowerCase();
    password = request.body['password'];
    fullname = request.body['fullname'];
    repeat_password = request.body['repeat_password'];
    email = request.body['email'];


    // below are checks for username
    // plan on organizing validation from most complex to least to give the most accurate error
    // check if username input is entered
    if (request.body.username == '') {
        errors['username'] = `You need to enter a username!`;
    }
    // check is username taken
    if (typeof users_reg_data[username] != 'undefined') {
        errors['username'] = `Hey! ${username} is already taken!`;
    }
    // if username meets character length requirement < 4
    if (username.length < 4) {
        errors['username'] = `Username must be longer than 4 characters`;
    }
    // if username meets character length requirement > 10
    if (username.length > 10) {
        errors['username'] = `Username has maximum of 10 characters`;
    }
    // need to check if username has special characters
    // add special characters to a variable
    var badcharacters = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/? ]+/;
    var badcharacters_username = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/;
    if (username.match(badcharacters_username)) {
        errors['username'] = `Username must have letters and numbers only`;
    }
    // now to check passwords
    // check if password matches repeat password
    if (request.body.password != request.body.repeat_password) {
        errors['password'] = `Repeat password not the same as password!`;
        errors['repeat_password'] = `Repeat password not the same as password!`;
    }

    // check if password is 6 characters or less
    if (password.length < 6) {
        errors['password'] = `Password must have a minimum of 6 characters`;
    }
    // check if theres a password input
    if (request.body.password == '') {
        errors['password'] = `You need a password!`;
    }
    //now to check email
    // taken from https://www.w3resource.com/javascript/form/javascript-sample-registration-form-validation.php
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (email.match(mailformat)) {
    } else {
        errors['email'] = `must enter a valid email without special characters`;
    }

    // now to check full name
    // only allows letters and max of 30 characters
    // var lettersonly = /^[A-Za-z]+$/;
    if (fullname.length < 31) {
    } else {
        errors['fullname'] = `Full name must be letters only and less than 30 characters`;
    }
    // if theres 0 errors, write data to reg file, and redirect to invoice
    // otherwise if there are errors, send client back to register with data and error
    // so basically, im gonna assume errors for each one in order to try get rid of undefined popping up, plus its an eye sore
    if (Object.keys(errors).length === 0) {
        console.log(errors);
        delete errors;
        users_reg_data[username] = {};
        users_reg_data[username].password = request.body.password;
        users_reg_data[username].email = request.body.email;
        users_reg_data[username].name = request.body.fullname;
        fs.writeFileSync(filename, JSON.stringify(users_reg_data));
        console.log("Saved User: " + request.body.username);

        request.session['username'] = username;
        request.session['email'] = email;
        request.session['full_name'] = fullname;
        console.log(request.session);
        response.redirect(`./products_display.html?products_key=jordan`);
    } else {
        // code from help with proffesor
        // if theres errors, send input and error data back to login page plus qs for products info
        params.append('reg_data', JSON.stringify(request.body));
        params.append('reg_errors', JSON.stringify(errors));
        response.redirect(`./register.html?${params.toString()}`);
    }
});

// Taken from assignment 3 code examples
// If there's a get request to retreive cart info '/get_cart', this will respond with the json data
app.post("/get_cart", function (request, response) {
    response.json(request.session.cart);
});

// This is a get to the session data
// This will be used when ever a site needs to get info from the session like the cart or usrname
app.get("/session_data.js", function (request, response, next) {
    response.type('.js');
    // declare a shopping cart if there isn't one
    if (typeof request.session.cart == 'undefined') {
        request.session.cart = {};
    }
    // now to declare the username, email, name 
    // Gonna keep all the data into one long Javascript string with the data as variables
    var session_str = `var user_name = ${JSON.stringify(request.session.username)}; var full_name = ${JSON.stringify(request.session.full_name)}; var user_email = ${JSON.stringify(request.session.email)}; var cart_data = ${JSON.stringify(request.session.cart)};`;
    // send the client the session string
    response.send(session_str);
})

// This is for when the user clicks log out
// destorys the session data and sends user back to homepage
// may be utilized for something else
app.get("/logout", function (request, response, next) {
    request.session.destroy();
    console.log(request.session);
    response.redirect('./');
});

// This is to update the cart info
// Will take the request body from the post and update the cart data with it
// not worried about invalid quantities as they can only select how much they want, not type it in
app.post("/cart_update", function (request, response, next) {
    console.log(request.body);
    for (product_key in request.session.cart) {
        for (i in request.session.cart[product_key]) {
            // this is to basically skip quantities that are 0
            // because if there is a 0, it creates a blank field in the cart, and thats an error
            if (request.session.cart[product_key][i] == 0) {
                continue;
            }
            request.session.cart[product_key][i] = Number(request.body[`cart_update_${product_key}_${i}`]);
        }
    }
    console.log(request.session);
    response.redirect("./cart.html");
})

// This is used to process the checkout
// this will also remove the quantities selected from the products_data
// then will redirect user to invoice
app.post("/cart_checkout", function (request, response) {
    // gotta check if there is a username in the session
    // if there isn't a username, just redirect to the cart page with an error
    // if there IS a username, just do the mail stuff and redirect to invoice page
    if (typeof request.session.username == 'undefined') {
        console.log(`NOTfound a username`);
        response.redirect('/cart.html?NotLoggedIn');
    } else {
    console.log(`found a username`);

    // gonna do the remove items from the quantity availablke here because it makes more sense to do so than after the invoive is generated
    // gonna try the edit cart stuff here
    // inspiration from Brandon Marcose
    // This will define the cart
    // get the quantities for the individual product in the brand list
    // then takes those quantities and removes them from the quantity available data
    var last_cart = request.session.cart;
    for (product_key in products_data) {
        for ( i = 0; i < products_data[product_key].length; i++) {
            // from here, if the brand is not a part of the cart, it'll just continue and update any that do
            if (typeof last_cart[product_key] == 'undefined') continue;{
                var last_qty = last_cart[product_key][i];
                products_data[product_key][i]['quantity_available'] -= last_qty;
            }
        }
    };

    // Generate HTML invoice string
    var invoice_str = `<span style="display: flex; font-size: large; color: black; justify-content: center; text-align: center;">Thank you for your order ${request.session.full_name}!<br>Happy Holidays!</span><br><table border="2px">
    <thead>
        <th>
            Shoe
        </th>
        <th>
            Quantity
        </th>
        <th>
            Price
        </th>
        <th>
            Extended Price
        </th>
    </thead>`;
    var shopping_cart = request.session.cart;
    let subtotal = 0;
    // need to get total from qs
    // having trouble with getting shopping cart total from the cart itself
    let params = new URLSearchParams(request.query);

    if (params.has('total')) {
        var total = params.get('total');
    }
    console.log(total);
    let total_quantity = total;

    for (product_key in products_data) {
        for (i = 0; i < products_data[product_key].length; i++) {
            if (typeof shopping_cart[product_key] == 'undefined') continue;
            qty = shopping_cart[product_key][i];
            if (qty > 0) {
                extended_price = products_data[product_key][i]['price'] * qty;
                subtotal = subtotal + extended_price;
                invoice_str += `<tr>
                <td>
                    ${products_data[product_key][i]['name']}
                </td>
                <td>
                ${qty}
                </td>
                <td>
                    $${products_data[product_key][i]['price']}
                </td>
                <td>$${extended_price.toFixed(2)}</td>
            </tr>`;
            }
        }
    }

    var tax_rate = 0.045;
        var salestax = tax_rate * subtotal;

        // Compute total before shipping
        var check_total = subtotal + salestax;

        // Compute Shipping cost
        var shipping_costs = (total_quantity < 4) ? 30*total_quantity : (total_quantity < 11) ? 25*total_quantity : 15*total_quantity;

        // compute grand total
        var grand_total = check_total + shipping_costs;
        invoice_str += `<tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr>
        <tr><td class="text-right"><strong>Subtotal</strong><td>&nbsp;</td></td><td>&nbsp;</td><td><strong>$${subtotal.toFixed(2)}</strong></td></tr> 
        
        <tr><td class="text-right"><strong>HI Sales Tax @ 4.5%</strong><td>&nbsp;</td></td><td>&nbsp;</td><td><strong>$${salestax.toFixed(2)}</strong></td></tr> 

        <tr><td class="text-right"><strong>Shipping</strong><td>&nbsp;</td></td><td>&nbsp;</td><td><strong>$${shipping_costs.toFixed(2)}</strong></td></tr>

        <tr><td class="text-right"><strong>Grand Total</strong><td>&nbsp;</td></td><td>&nbsp;</td><td><strong>$${grand_total.toFixed(2)}</strong></td></tr>
        
        </table>`;

    // taken from https://mailtrap.io/blog/nodemailer-gmail/
    // basically lets you send messages from gmail server instead of using UH's like in the example
    // need to declare the users email
    var user_email = request.session.email;
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: '2019morriss@kalanihs.org',
          pass: 'zqQTddkeftRvZxwj'
        }
      });
      
      const mailOptions = {
        from: 'seanshoestore@kicks.com',
        to: user_email,
        subject: `Thank You for Your Order ${request.session.full_name}- Sean's Shoe Store`,
        html: invoice_str
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
            invoice_str += '<br>There was an error and your invoice could not be emailed :(';
        } else {
            invoice_str += `<br>Your invoice was mailed to ${user_email}`;
        }
        response.redirect(`./invoice.html`);
      });
    };

})

// this is used to get the user back to the homepage after the invoice
// this just redirects to index and deletes the items in the cart
// I should try get the items in the cart and remove them from the server but seems kinda hard
app.post("/exitinvoice", function (request, response) {
    console.log('got the exit');
    request.session.cart = {};
    console.log(request.session.cart);
    response.redirect('./index.html');
})

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