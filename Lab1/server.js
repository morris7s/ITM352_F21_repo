// Got help from Prof and from classmates
app.post('/purchase', function (request, response, next) {
    // Turn the Post request body into a variable
    let reqbody = request.body;

    // Must check if the form input is 0 or not
    var errors = {}; // assumes 0 errors at first
    errors['no_quantities'] = 'Must enter a valid amount!';

    for (i in products_array) {
        reqbodyi = reqbody['quantity' + i]; // breaks down the reqbody into the each quanitity of certain product
        // If invalid quantities inputed, there will be an alert for that product
        if (isNonNegInt(reqbodyi) == false) {
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
        else{
            let errorsObj = {'error': JSON.stringify(errors)};
            qstring += '&' + qstring.stringify(errorsObj);
            // after getting the errors into a querystring, we send the client back to the products page
            response.redirect("./products_display.html?" + qstring);
    }

});