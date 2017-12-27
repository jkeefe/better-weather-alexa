# How I build it (and you can, too)

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
npm install claudia --save-dev
npm install request alexa-sdk --save

```

Pushed the initial deploy to lambda using this:

`AWS_PROFILE=personal-lambda-master ./node_modules/.bin/claudia create --region us-east-1 --handler bot.handler --role lambda-executor`

Then ...

- Logged into [AWS](https://aws.amazon.com/) 
- Went into the [AWS Lambda console](https://console.aws.amazon.com/lambda/)
- Clicked on the `better-weather-lambda` function
- Under "Add Triggers" picked "Alexa Skills Kit"
- Needed to scroll down to the "Configure Trigger" and confirm the default there
- Then "Save" at the top of the page

## Alexa Setup

(screenshots available)

- Opened a new tab in my browser
- Went to developers.amazon.com
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
    
## Weather Forecast Code

I need to adjust `bot.js` to be get the weather from the National Weather Service, which is really my favorite source. The API is [here](https://forecast-v3.weather.gov/documentation?redirect=legacy).


