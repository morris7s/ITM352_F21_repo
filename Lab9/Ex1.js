var month = 10;
var day = 4;
var year = 2001;

step1 = 1;
step2 = parseInt(step1/4);
step3 = step1 + step2;
step4 = 0;
step6 = step4 + step3;
step7 = step6 + day;
step8 = step7;
step9 = step8 - 1; // not a leap year
step10 = step9 % 7;


console.log(step10);