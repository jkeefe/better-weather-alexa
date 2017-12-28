const Alexa = require('alexa-sdk');
const request = require('request');
const parse = require('csv-parse');

// TODO replace with your app ID (OPTIONAL).
var APP_ID = undefined; 

// This is the main Alexa setup handler, incorporating all of the other handlers
exports.handler = function(event, context, callback) {

    // // comment out the below 4 lines to test locally
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

function buildSpeech () {
    
    // This is where the forecast-building happens.
    
    getForecastURL(40.7506,-73.9972)
    .then(getForecast)
    .then( (speech) => {
        console.log("Alexa would say:", speech);
        this.emit(":tell", speech);
    } ) 
    .catch( (error) => {
        console.log("Catching this error: ", error);
        this.emit(":tell", "Oh, I'm sorry. Something went wrong with my program.");
    });
            
}

/// utility functions start here ///

function getForecastURL(latitude, longitude) {
    return new Promise ((resolve, reject) => {
        var url = `https://api.weather.gov/points/${latitude},${longitude}`; 
        
        // calls to the weather service require (any) User-Agent
        var options = {
            url: url,
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
                'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
            }
        };
        
        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                var errorSpeech = "I had trouble reaching the national weather service, so I can't provide a forecat just now.";
                reject(errorSpeech);
                console.log("Response:", response);
                console.log("Error:", error);
                console.log("Body:", body);
                return;
            }
            
            var data = JSON.parse(body);
            console.log(data);
            
            // test for existing data.properties.forecast
            
            resolve(data.properties.forecast);
            
        });
    });
}

function getForecast(url){
    return new Promise ((resolve,reject) => {
        
        console.log("The url is: ", url);
                
        var options = {
            url: url,
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
                'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
            }
        };
        
        request(options, function (error, response, body) {
            
            if (error || response.statusCode != 200) {
                var errorSpeech = "I had trouble reaching the national weather service, so I can't provide a forecat just now.";
                console.log("Response:", response);
                console.log("Error:", error);
                console.log("Body:", body);
                resolve(errorSpeech);
                // this.emit(":tell", errorSpeech);
                return;
            }
        
            var data = JSON.parse(body);
        
            console.log('data:', data); 
            
            var forecasts = data.properties.periods;
            var forecastSpeech = `Here's your better weather: ${forecasts[0].name}: ${forecasts[0].detailedForecast}. ${forecasts[1].name}: ${forecasts[1].detailedForecast}`;
            
            resolve(forecastSpeech);
            
        });
        
        
    });
}



