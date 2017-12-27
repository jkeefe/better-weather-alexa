# better-weather-alexa
Giving Alexa a weather upgrade thanks to the National Weather Service


## Starting up

```
npm init --yes
npm install claudia --save-dev
npm install alexa-sdk request --save

```

## Initial deploy

`AWS_PROFILE=personal-lambda-master ./node_modules/.bin/claudia create --region us-east-1 --handler bot.handler --role lambda-executor`

## Subsequent deploys

`AWS_PROFILE=lambda-master ./node_modules/.bin/claudia update`

## Lambda Bucket Permissions

In the AWS console, went to IAM and then to the role the lambda function is using, `lambda-executor`. Gave it the same `AccessMediaBucket` that I gave the Pi in `pi-photo`.

