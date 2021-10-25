function isNonNegInt(q, returnErrors = false) {
    // checks if a string 'q' is a non-neg integer. If returnErrors is true, the array of errors is returned
    //Other returns true if q is a non-neg int.
    errors = []; // assume no errors at first
    if(q == '') q = 0;
    if (Number(q) != q) errors.push('Not a number!'); // Check if string is a number value
    if (q < 0) errors.push('Negative value!'); // Check if it is non-negative
    if (parseInt(q) != q) errors.push('Not an integer!'); // Check that it is an integer

    return returnErrors ? errors : (errors.length == 0);
}

var attributes  =  "Sean;20;20.5;-19.5;;9";

var parts = attributes.split(';');
/*
for(part of parts) {
    console.log(`${part} is it non-negative integer?: ${isNonNegInt(part)}`);
}
*/

parts.forEach((item, index) =>{console.log(`part ${item} is ${(isNonNegInt(item)?'a':'not a')} quantity`); } );

