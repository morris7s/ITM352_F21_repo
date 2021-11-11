var express = require('express');
var app = express();

app.all('*', function (request, response, next) {
    console.log(request.method + ' to path ' + request.path);
    next();
});

app.listen(8080, () => console.log(`listening on port 8080`)); // note the use of an anonymous function here to do a callback
app.get('/test', function (request, response){
    response.send('Does /test work? If so, you should see me ...' + request.body);
 
    next();
});
app.use(express.static('./public'));

app.post('/process_form', function (request, response){
    response.send('in POST send');
    next();
}); 