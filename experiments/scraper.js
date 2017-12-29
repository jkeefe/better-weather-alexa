const request = require('request');
const cheerio = require('cheerio');

var url = "https://forecast.weather.gov/MapClick.php?lat=40.750633&lon=-73.997177";

var options = {
    url: url,
    headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/63.0.3239.84 Safari/537.36',
        'accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8'
    }
};

request(options, function (error, response, body) {
    if (error || response.statusCode != 200) {
        // var errorSpeech = "I had trouble reaching the national weather service, so I can't provide a forecast just now.";
        // reject(errorSpeech);
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
        
    console.log(forecasts);
    
});