//var users_reg_data = require('./user_data.json');
const fs = require('fs');


filename = './user_data.json';
var req_test = require(filename);
var user_data_str = fs.readFileSync(filename, 'utf-8');
var user_data_obj = JSON.parse(user_data_str);
console.log(user_data_obj, typeof user_data_obj);
console.log(req_test, typeof req_test);