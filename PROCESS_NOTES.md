# Notes while building better-weather-alexa

## Lambda Function

Copied the following files from my [pi-photo-lambda](https://github.com/jkeefe/pi-photo-lambda) project:

```
.gitignore
bot.js
reference/intents.json
reference/sample_utterances
```

Then installed claudia (but don't need api-gateway, because the trigger will be Amazon Skills Kit.

```
npm init --yes
npm install claudia fast-csv --save-dev
npm install request alexa-sdk --save

```

Pushed the initial deploy to lambda using this:

`AWS_PROFILE=personal-lambda-master ./node_modules/.bin/claudia create --region us-east-1 --handler bot.handler --role lambda-executor`

`AWS_PROFILE=personal-lambda-master ./node_modules/.bin/claudia update`

Then ...

- Logged into [AWS](https://aws.amazon.com/) 
- Went into the [AWS Lambda console](https://console.aws.amazon.com/lambda/)
- Clicked on the `better-weather-lambda` function
- Under "Add Triggers" picked "Alexa Skills Kit"
- Needed to scroll down to the "Configure Trigger" and confirm the default there
- Then "Save" at the top of the page
- Set Timeout to 20 seconds
- Set Memory to 256MB

## Alexa Setup

- Opened a new tab in my browser
- Went to https://developers.amazon.com
- Logged in
- Skill Information
    - Picked "Alexa Skills Kit"
    - Name: "Better Weather"
    - Invocation name: "better weather"
    - Next
- Interaction Model:
    - Intent Schema: Copied from [./reference/intents.json](./reference/intents.json)
    - Sample Utterances: Copied from [./reference/sample_utterances.txt](./reference/sample_utterances.txt)
    - Next
- Configuration
    - Went back to the AWS Lambda function tab in my browser and copied the "ARN" from the top of the page, which looks like:  `arn:aws:lambda:us-east-1:XXXXXXXX:function:better-weather-alexa`
    - Back to the Alexa tab 
    - Service Endpoint Type: AWS Lambda ARN
    - Default: Pasted the ARN from the Lambda tab
    - Provide geographical region endpoints? No
    - Do you allow users to create an account or link to an existing account with you? No
    - In order to (later) have the skill adjust to the user's location, checked "Device Address" and "Country & Postal Code Only"
    - Next
    
## Zip Code Lookup

I want to customize the response based on the user's zip code. So process will be:

- Get Zip Code from user
    - Here's how to get that data: [Part 1](https://developer.amazon.com/docs/custom-skills/device-address-api.html) and [Part 2](https://developer.amazon.com/docs/custom-skills/device-address-api.html#getCountryAndPostalCode)
- Translate Zip Code to Lat Lon
    - Got Zip Code Centroids: https://gist.github.com/erichurst/7882666
    - Made utility for converting into JSON: `utilities/zips_to_json`
    - Note that there MUST be a carriage return after the last line, or you'll get a `column header mismatch expected: ...` error.
- Send Lat lon to NWS for the forecast URL
    - See below
- Hit forecast URL for the forecast!

## Weather Forecast

Built that in the `BuildSpeech()` function.

I needed to adjust `bot.js` to be get the weather from the National Weather Service, which is really my favorite source. The API is [here](https://forecast-v3.weather.gov/documentation?redirect=legacy).

OK ... WHOA ... that API is totally unreliable. Today it had yesterday's information stuck in it. And depending on the forecast URL, I either couldn't hit it or I couldn't hit it from a lambda function. (Also couldn't hit it if I VPN'd to somewhere else in the US.)

Instead, I'm hitting a NWS weather forecast page based on this URL structure ...

`https://forecast.weather.gov/MapClick.php?lat=41.8333925&lon=-88.01214956`

... and then scraping the `forecast-label` and `forecast-text` right off the page.

Also added a cache-bust to the url, like `&cb=123456`, to ensure we always get a fresh forecast.

## User Experience Tweaks

### MPH-dot

Turns out that `mph.` at the end of a sentence -- such as "Wind from the west at 10 mph." -- don't get treated like the end of a sentence. To make that clearer, I'm going to replace `mph.` with `mph. ...` for a natural pause.

### Waiting to get info

I want Alexa to say "Just a moment while I get your better weather from the national weather service ..." and then continue with the regular processing.

Turns out that's called issuing a progressive response, or "Directive" ... and details on that are [here](https://developer.amazon.com/docs/custom-skills/send-the-user-a-progressive-response.html)

The code for that looks like this:

```
POST https://api.amazonalexa.com/v1/directives HTTP/1.1
Authorization: Bearer AxThk...
Content-Type: application/json

{ 
  "header":{ 
    "requestId":"amzn1.echo-api.request.xxxxxxx"
  },
  "directive":{ 
    "type":"VoicePlayer.Speak",
    "speech":"This text is spoken while your skill processes the full response."
  }
}
```



