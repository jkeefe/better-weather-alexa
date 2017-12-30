const Alexa = require('alexa-sdk');
const request = require('request');
const cheerio = require('cheerio');
const zips = require('./data/zips.json');


// turns on/off logging
const logger = true;

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
    
    // Send a "Directive" which lets folks know we're working on the answer
    sendDirective(this.event);
    
    // Simultaneously, walk through assembling the forecast
    getDeviceZip(this.event)
    .then(getForecastFromPage)
    .then( (speech) => {
        console.log("Alexa would say:", speech);
        this.emit(":tell", speech);
    } ) 
    .catch( (error_speech) => {
        this.emit(":tell", error_speech);
    });
            
}

/// utility functions start here ///

// Let folks know we're working on it!
function sendDirective(event) {
    
    var token = event.context.System.apiAccessToken;
    var endpoint_domain = event.context.System.apiEndpoint;
    var requestID = event.request.requestId;
    var authorization = "Bearer " + token;
    var endpoint = `${endpoint_domain}/v1/directives`;
    
    var payload = {
        header:{ 
            requestId: requestID
        },
        directive:{ 
            type: "VoicePlayer.Speak",
            speech: "OK! Let me get that for you."
        }
    };
    
    
    var options = {
        url: endpoint,
        json: true,
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'Authorization': authorization,
        },
        body: payload
    };
    
    request(options, function(error, response, body) {
        
        if (error) {
            console.log("Error posting directive:", error);
        }
        
        if (response.statusCode != 204) {
            console.log("Unexpected response code while posting directive:", response.statusCode);
            console.log("Response body:", body);
        }
        
        return;
        
    });
    
}

// Get the lat-lon object based on a raw zip code
function useZip(zipcode) {
    return new Promise ((resolve, reject) => {
        
        var zip_object = zips[zipcode];
        
        if (!zip_object) {
            var errorSpeech = "I wasn't able to look up the zip code I got, so I can't provide a forecast.";
            reject(errorSpeech);
            return;
        }
        
        resolve(zip_object);
        
    });    
}

// Get the lat-lon object based on the Aelexa device zip code
function getDeviceZip(event) {
    return new Promise ((resolve, reject) => {
        
        var token = event.context.System.apiAccessToken;
        var endpoint_domain = event.context.System.apiEndpoint;
        var deviceID = event.context.System.device.deviceId;
        var authorization = "Bearer " + token;
        var endpoint = `${endpoint_domain}/v1/devices/${deviceID}/settings/address/countryAndPostalCode`;
        
        var options = {
            url: endpoint,
            headers: {
                'Accept': 'application/json',
                'Authorization': authorization,
            }
        };

        request(options, function(error, response, body) {
            
            var errorSpeech;
            
            if (error || response.statusCode != 200) {
                errorSpeech = "I had trouble figuring out your zip code, which I need to get you the right forecast. You may need to grant Better Weather permission to use your location in the Alexa app under 'Skills.'";
                reject(errorSpeech);
                console.log("Response:", response);
                console.log("Error:", error);
                console.log("Body:", body);
                return;
            }
            
            if (logger) {
                console.log("User's location data is:", body);
            }
            
            var data = JSON.parse(body);
            
            if (!data || !data.hasOwnProperty('countryCode') ) {    
                errorSpeech = "I couldn't tell what country you are in. You may need to update your device address information. Or you may need to reinstall the Better Weather skill and consent to providing your address information.";
                reject(errorSpeech);
                console.log("No countryCode in data");
                return;
            }
            
            if (data.countryCode != "US") {
                errorSpeech = "I'm sorry, Better Weather only works in the United States, and your device appears to be in another country.";
                console.log("Device not in US.");
                reject(errorSpeech);
                return;
            } 
            
            if (!data.hasOwnProperty('postalCode') ) {
                errorSpeech = "I couldn't tell what zip code you are in. You may need to update your device address information. Or you may need to reinstall the Better Weather skill and consent to providing your address information.";
                reject(errorSpeech);
                console.log("No postalCode in data");
                return;
            }
            
            if (!data.postalCode || data.postalCode === "98109") {
                // note 98109 is Alexa's default postal code
                errorSpeech = "I couldn't tell what zip code you are in. You may need to update your device address information. Or you may need to reinstall the Better Weather skill and consent to providing your address information.";
                reject(errorSpeech);
                console.log("Blank or default postal code found in data");
                return;
            }
            
            // lookup the lat/lon object from zips.json.
            var zip_object = zips[data.postalCode];
            
            // make sure we found one
            if (!zip_object) {
                errorSpeech = "I don't have location data for your zip code, so I can't provide a forecast. Sorry.";
                console.log("Data lookup failed for zip code:", data.postalCode);
                reject(errorSpeech);
                return;
            }
            
            if (logger) {
                console.log("Using Zip Code:", data.postalCode);
                console.log("Zip data is:", JSON.stringify(zip_object));
            }
            
            resolve(zip_object);
            
        });
        
    });
}

// Scrape the forecast off a NWS page for a given lat/lon
function getForecastFromPage(zip_object) {
    return new Promise ((resolve, reject) => {
        
        var cachebust = Date.now();
        var url = `https://forecast.weather.gov/MapClick.php?lat=${zip_object.lat}&lon=${zip_object.lon}&cb=${cachebust}`;

        var options = {
            url: url,
            headers: {
                'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
                'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
            }
        };

        request(options, function (error, response, body) {
            if (error || response.statusCode != 200) {
                var errorSpeech = "I had trouble reaching the national weather service, so I can't provide a forecast just now.";
                reject(errorSpeech);
                console.log("Response:", response);
                console.log("Error:", error);
                console.log("Body:", body);
                return;
            }
            
            const $ = cheerio.load(body);
            
            var forecasts = [];

            var label_objects = $('body').find($('.forecast-label'));
            label_objects.each(function(i, elem){
                
                var label = $(this).text();
                var forecast = $(this).siblings('.forecast-text').text();
                forecasts.push(label + ": " + forecast);
                
            });
            
            // we just use the first two forecasts.
            var speech = "Here's your better weather ... " + forecasts[0] + " ... And for " + forecasts[1];
            
            // alexa is having trouble with sentences ending in abbreviations, like `at 8 mph.`
            // so adding extra pauses there.
            var cleaned_speech = speech.replace(". ", " ... ");
            resolve(cleaned_speech);
            
        });
        
    });
}

// When I was using the (unreliable) NWS API, use lat/lon to get forecast URL
function getForecastURL(zip_object) {
    return new Promise ((resolve, reject) => {
        
        var cachebust = Date.now();
        var url = `https://api.weather.gov/points/${zip_object.lat},${zip_object.lon}?cb=${cachebust}`;
        
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
                var errorSpeech = "I had trouble reaching the national weather service, so I can't provide a forecast just now.";
                reject(errorSpeech);
                console.log("Response:", response);
                console.log("Error:", error);
                console.log("Body:", body);
                return;
            }
            
            var data = JSON.parse(body);
            
            if (logger) {
                console.log("NWS points/location data:", data);
                
            }
            
            // test for existing data.properties.forecast
            
            resolve(data.properties.forecast);
            
        });
    });
}

// When using the (unreliable) NWS API, use forecast URL to get the forecast text.
function getForecast(url){
    return new Promise ((resolve,reject) => {
        
        console.log("The url is: ", url);
                
        var options = {
            url: url,
            json: false,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
                'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
            }
        };
        
        request(options, function (error, response, body) {
            
            if (error || response.statusCode != 200) {
                var errorSpeech = "I had trouble reaching the national weather service, so I can't provide a forecast just now.";
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



