var dollarvalue = 1.75;
var amount = dollarvalue*100;

// find max num of quarters
var numofq = parseInt(amount/25);
var qremainder = amount%25;

// find max num of dimes
var numofd = parseInt(qremainder/10);
var dremainder = qremainder%10;

// find max num of nickels
var numofn = parseInt(dremainder/5)
var nremainder = dremainder%5;

// remainder is pennies 
var numofp = nremainder;


console.log(`We neeed ${numofq} quarters, ${numofd} dimes, ${numofn} nickels, and ${numofp} pennies to get $${dollarvalue}`)