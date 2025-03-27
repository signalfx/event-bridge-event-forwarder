# Splunk Observability Cloud (aka SignalFx) EventBridge Event Forwarder

## Overview
These instructions will describe the steps to deploy the Lambda function which forwards the Amazon EventBridge events to the Splunk Observability Cloud (aka SignalFx) as Custom Events.
The deployed function can be easily modified to send other types of Custom Events to SignalFx,
or to transform events before sending (for example, to filter only selected fields or to use different field names).

There are two ways to install this Lambda function: using AWS Serverless Repository (recommended) or AWS Lambda Console.
This instruction covers installation with AWS Serverless Repository.
Installation using AWS Lambda Console and additional information are available in the [README](README.md).

### Filtering EventBridge Events
After installation, this Lambda function will be triggered by an EventBridge Event or a [EventBridge Event rule](https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-create-rule.html).
You should use the rules to filter the EventBridge Events you want to be forwarded.

## Prerequisites
##### 1. Prepare SignalFx Access Token
To retrieve your [access token](https://docs.splunk.com/observability/en/admin/authentication/authentication-tokens/org-tokens.html):

* Open Splunk Observability Cloud and go to Settings > Access Tokens.
* Choose an existing token or create a new one.
* Click the entry with the token and click "Show value".

This value will be later used as a SignalFx Access Token.

##### 2. Locate SignalFx Ingest Endpoint
By default, this Function will send data to the us0 realm. As a result, if you are not in the us0 realm, then you must explicitly set your realm.

To locate your realm:

* Open SignalFx and in the top, right corner, click your profile icon.
* Click My Profile.
* In the Organizations, Endpoints section, notice the value listed as "Real-time Data Ingest Endpoint".

This value will be later used as a SignalFx Ingest Endpoint.

##### 3. (Optional) Create a managed KMS key to encrypt the SignalFx Access Token in transit

###### Overview
You will need to provide the Lambda Function with a SignalFx Access Token stored in an environment variable.
As a best security practice, it is recommended that the token is encrypted using the Amazon Key Management Service. For the overview of this process see
"Securing Environment Variables" section of [AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html).

In both installation methods, you have the option to use either encrypted or plain token variable.

###### Creating a KMS key
In order to encrypt SignalFx Access Token, please make sure you have a managed Symmetric KMS key available for use.
* If you are creating a new key, make sure you choose a Symmetric key.
* For overview and help on securing environment variables, consult the [AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-encryption).
* Documentation on KMS encryption using the AWS CLI can be found [here](https://awscli.amazonaws.com/v2/documentation/api/latest/reference/kms/encrypt.html).

Regardless of the key creation method, make sure you have access to the cipher text output as well as the key id of the encryption key you used.

### Install from Serverless Application Repository 

In this option, you will deploy an Application from Serverless Application Repository.
A Lambda Function, EventBridge Event Rule and all necessary configurations will be created for you.
This is a recommended and less time-consuming option.

__NOTE__: If you choose a version with token encryption, it will be by default configured to omit the events from `aws.kms`. The reason for this behavior is to avoid an infinite loop: when the lambda runs, it decrypts the token and thus generates an EventBridge Event.

#### Step 1: Locate the application in Serverless Application Repository
* Sign in to the AWS Management Console and open the [Serverless Application Repository console](https://console.aws.amazon.com/serverlessrepo/).
* Choose "Available Applications" and search for "SignalFx EventBridge Event Forwarder" or "SignalFx EventBridge Event Forwarder - encrypted" application.
* Click on the right application entry, depending if you wish to encrypt the token environment variable in transit.
#### Step 2: Fill out the Application Parameters
* Set the `Application Name` to describe the application's purpose in your environment, for example `SignalFx EventBridge Event Forwarder App`.
* Set the `EventSources` parameter to include the services from which you want to forward events to SignalFx.
  Enter a comma delimited list to specify multiple services as sources, for example: `aws.ec2,aws.s3`. Please be aware that including `aws.lambda` may lead to invocation loop (e.g. if you have two lambdas which react on `aws.lambda` they will cause invocation loop). If you use encrypted version please avoid `aws.kms` as it leads to an invocation loop.

  Note: You will be later able to modify the Event Pattern in the EventBridge Events console.

* If you chose version without encryption, set `SignalFxAccessToken` to the SignalFx Access Token value you identified in Prerequisites.
* If you chose version with encryption, set `EncryptedSignalFxAccessToken` to the value of SignalFx Access Token identified in Prerequisites encrypted with a prepared KMS key.
  Set the `KeyId` parameter to the Key Id of this key; it is the last section of the key's ARN.
* Set `SignalFxIngestEndpoint` parameter to the SignalFx Ingest Endpoint value you identified in Prerequisites.
* You may leave `SignalFxSendTimeout` parameter with a default value of 1000 ms.

#### Step 3: Deploy
* Click "Deploy".
* You're ready! The integration is now configured. See [here](https://docs.splunk.com/observability/en/metrics-and-metadata/view-data-events.html#events-intro) how to view and use events in SignalFx.
* (Optional) If you wish to modify any application parameters, you can now do so in AWS Console. You may be interested in modifying Lambda code or the Amazon EventBridge rule which triggers the Lambda.

### Additional Information
#### Details on EventBridge event to SignalFx Custom Event transformation
SignalFx Custom Event needs to be sent as a key-value map. This Lambda function will transform any Amazon EventBridge event to conform to [naming and format restrictions of a SignalFx](https://dev.splunk.com/observability/docs/datamodel/custom_events),
and then forward it to SignalFx.

By default, based on an EventBridge Event, this lambda will create a SignalFx Custom Event in a following way:

* event category will always be set to `USER_DEFINED`
* event type will always be set to `EventBridge`
* `source`, `account`, `detail-type`, `region` keys which are common for all EventBridge events and have a limited set of possible values will be sent as `dimensions` (`detail-type` will be sent as `detailType`)
* `time` property will be converted to Unix epoch time and sent as a timestamp of the SignalFx Custom Event.

Other keys will be transformed in the ways listed below, and sent as `properties`:
* special characters in keys, such as `" "` (space), `":"` or `"/"` will be replaced with a `"_"` character. The allowed characters are `[a-zA-Z0-9\-_]`.
* for nested objects, each of its properties will be copied to the SignalFx Custom Event under a key which is a join of all parent objects' names separated with a `"_"` character.
See exemplary transformation below.
* for arrays, each element will be copied to the SignalFx Custom Event under a key which is a `"_"` character join of an array name and an index of the element.


For example, a sample EventBridge event:

```json
{
  "id":"7bf73129-1428-4cd3-a780-95db273d1602",
  "detail-type":"EC2 Instance State-change Notification",
  "source":"aws.ec2",
  "account":"123456789012",
  "time":"2015-11-11T21:29:54Z",
  "region":"us-east-1",
  "resources":[
    "arn:aws:ec2:us-east-1:123456789012:instance/i-abcd1111"
  ],
  "detail":{
    "instance-id":"i-abcd1111",
    "state":"pending"
  }
}
```
will be transformed to a Custom SignalFx Event:
```json
{
  "category":"USER_DEFINED",
  "eventType":"EventBridge",
  "dimensions":{
    "detailType":"EC2 Instance State-change Notification",
    "source":"aws.ec2",
    "account":"123456789012",
    "region":"us-east-1"
  },
  "properties":{
    "id":"7bf73129-1428-4cd3-a780-95db273d1602",
    "resources_0":"arn:aws:ec2:us-east-1:123456789012:instance/i-abcd1111",
    "detail_instance-id":"i-abcd1111",
    "detail_state":"pending"
  },
  "timestamp":1447277394000
}
```

#### Useful links:
* [Sending Custom Events to SignalFx](https://dev.splunk.com/observability/docs/datamodel/custom_events)
