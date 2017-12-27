const Alexa = require('alexa-sdk');
const request = require('request');

// TODO replace with your app ID (OPTIONAL).
var APP_ID = undefined; 

// This is the main Alexa setup handler, incorporating all of the other handlers
exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.appId = APP_ID;
    alexa.registerHandlers(newSessionHandlers);
    alexa.execute();
};

var newSessionHandlers = {
    "LaunchRequest": function () {
        buildSpeech.call(this);
    },
    "AMAZON.StartOverIntent": function() {
        buildSpeech.call(this);
    },
    "AMAZON.HelpIntent": function() {
        buildSpeech.call(this);
    },
    "AMAZON.RepeatIntent": function () {
        buildSpeech.call(this);
    },
    "Unhandled": function () {
        var speechOutput = "Hmmm. Something went wrong. Sorry!";
        this.emit(":ask", speechOutput, speechOutput);
    }
};

function getForecastURL(latitude, longitude) {
    return new Promise ((resolve, reject) => {
        var url = `https://api.weather.gov/points/${latitude},${longitude}`; 
        request(url, error, response, body) {
            if (error || response.statusCode != 200) {
                var errorSpeech = "I had trouble reaching the national weather service, so I can't provide a forecat just now.";
                reject(errorSpeech);
                return;
            }
            
            var data = JSON.stringify(body);
            
            // test for existing data.properties.forecast
            
            resolve(data.properties.forecast)
            
        }
    });
}

function getForecast(url){
    return new Promise ((resolve,reject) => {
        
        request(url, function (error, response, body) {
            
            if (error || response.statusCode != 200) {
                var errorSpeech = "I had trouble reaching the national weather service, so I can't provide a forecat just now.";
                resolve(errorSpeech);
                // this.emit(":tell", errorSpeech);
                return;
            }
        
            var data = JSON.stringify(body);
        
            console.log('data:', data); 
            
            var forecasts = data.properties.periods;
            var forecastSpeech = ""
        });
        
        
    });
}


function buildSpeech () {
    

    
    
    var s3 = new AWS.S3();
    var params = {Bucket: 'media.johnkeefe.net', Key: 'vision.json'};
    var s3file = s3.getObject(params);
    
    console.log("Data: ", s3file);
    
    var data = JSON.parse(s3file);
    
    var outputSpeech = "The words describing what I see include: ";
    // build the list Alexa says
    for (var i = 0; i < data.labels.length(); i++) {

        // add "and" to the last one
        if (i == data.labels.length() - 1) {
            outputSpeech += "and, ";
        }
        
        outputSpeech += data.labels[i] + ", ";
        
    }
    
    this.emit(":tell", outputSpeech);
            
}
