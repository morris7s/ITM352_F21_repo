var products_array = require('./products.json');
var express = require('express');
var app = express();
const fs = require('fs');

app.use(express.urlencoded({ extended: true }));

var filename = './user_data.json';
var user_data_str = fs.readFileSync(filename, 'utf-8');
var users_reg_data = JSON.parse(user_data_str);
console.log(users_reg_data);


app.get("/invoice", function (request, response) {
    // Give a simple invoice using query string data
    response.send(`You want ${request.query['quantity']} items`);
});

app.get("/select_quantity", function (request, response) {

    // Give a simple quantity form
    str = `
    <body>
    <form action="" method="POST">
    <input type="text" name="quantity" size="40" placeholder="enter quantity desired" ><br />
    <input type="submit" value="Submit" id="submit">
    </form>
    </body>
        `;
    response.send(str);
});

app.post("/select_quantity", function (request, response) {
    // Redirect to login page with form data in query string
    let params = new URLSearchParams(request.body);
    response.redirect('./login?' + params.toString());
});

app.get("/login", function (request, response) {
    console.log(request.params.toString());
    // Give a simple login form
    let params = new URLSearchParams(request.query);
    str = `
<body>
<form action="?${params.toString()}" method="POST">
<input type="text" name="username" size="40" placeholder="enter username" ><br />
<input type="password" name="password" size="40" placeholder="enter password"><br />
<input type="submit" value="Submit" id="submit">
</form>
</body>
    `;
    response.send(str);
});

app.post("/login", function (request, response) {
    let params = new URLSearchParams(request.query);
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    the_username = request.body['username'].toLowerCase();
    the_password = request.body['password'];
    if (typeof users_reg_data[the_username] != 'undefined') {
        if (users_reg_data[the_username].password == the_password) {
            response.redirect('./invoice?' + params.toString());
        } else {
            response.send(`Wrong password!`);
        }
        return;
    }
    response.send(`${the_username} does not exist`);
});

// route all other GET requests to files in public 
app.use(express.static('./public'));

var listener = app.listen(8080, () => { console.log('server started listening on port ' + listener.address().port) });