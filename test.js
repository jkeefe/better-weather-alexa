var app = require('./bot.js');

var send_to_app = "hello!";

app.handler(send_to_app, null, function(error, result){
    console.log(result);
});