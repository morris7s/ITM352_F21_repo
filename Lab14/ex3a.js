var express = require('express');
var app = express();
const fs = require('fs');

var filename = './user_data.json';

if (fs.existsSync(filename)) {
    var file_stats = fs.statSync(filename); // takes the 'stats' from the file source
    console.log(`${filename} has ${file_stats.size} characters`);
    // gets the user data and recieves a string
    var user_data_str = fs.readFileSync(filename, 'utf-8');
    // after getting the user's data, this will read it it and parse it into user_data object
    var user_data = JSON.parse(user_data_str); // turns the string into an object
    console.log(user_data);
} else {
    console.log(`Hey! ${filename} doesn't exist!`)
};

app.use(express.urlencoded({ extended: true })); // this takes the data from the form field (which is 'urlencoded'), it will decode the data out of the request, and puts it into a request.body for the POST 

app.get("/login", function (request, response) {
    // if it gets a /login , it will generate 'this' function which is a login page
    // Give a simple login form
    str = `
            <body>
            <form action="" method="POST">
            <input type="text" name="username" size="40" placeholder="enter username" ><br />
            <input type="password" name="password" size="40" placeholder="enter password"><br />
            <input type="submit" value="Submit" id="submit">
            </form>
            </body>
    `;
    response.send(str);
});

app.post("/login", function (request, response) {
    // Process login form POST and redirect to logged in page if ok, back to login page if not
    let login_username = request.body['username'];
    let login_password = request.body['password'];
    // check if username exists within the accounts
    // as long as the entered usernmae exists, then we need to check if password entered matches the pass stored
    if (typeof user_data[login_username] != 'undefined') {
        // takes the stored password and checks if it matches with the inputed one
        if (user_data[login_username]["password"] == login_password) {
            // if pass matches, this resonse is given
            response.send(`${login_username} is logged in`);
        }
        else {
            // if pass doesn't match, this reponse is given
            response.send(`Incorrect password for ${login_username}`);
        }
    } else {
        // if the inputed username doesn't exist, this response is given 
        response.send(`${login_username} username does not exist`);
    }
    response.send('processing login' + JSON.stringify(request.body));
});

app.get("/register", function (request, response) {
    // Give a simple register form
    str = `
        <body>
        <form action="" method="POST">
        <input type="text" name="username" size="40" placeholder="enter username" ><br />
        <input type="password" name="password" size="40" placeholder="enter password"><br />
        <input type="password" name="repeat_password" size="40" placeholder="enter password again"><br />
        <input type="email" name="email" size="40" placeholder="enter email"><br />
        <input type="submit" value="Submit" id="submit">
        </form>
        </body>
    `;
    response.send(str);
});

app.post("/register", function (request, response) {
    // process a simple register form
    // must assign the new inputs into variables
    let new_login_username = request.body['username'];
    let new_login_password = request.body['password'];
    let new_login_repeatpassword = request.body['repeat_password'];
    let new_login_email = request.body['email'];

    // if the username doesnt exist AND both password and repeat password are the same, we will save the new user info
    if(user_data[new_login_username] !='undefined' && new_login_password == new_login_repeatpassword){
        console.log('testing so far')
    }
});

app.listen(8080, () => console.log(`listening on port 8080`));