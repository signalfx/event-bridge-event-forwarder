# SignalFx CloudWatch Event Forwarder

## Overview
These instructions will describe the steps to deploy the Lambda function which forwards CloudWatch events to SignalFx as Custom Events.
The deployed function uses SignalFx Lambda Wrapper and can be easily modified to send other types of Custom Events to SignalFx, 
or to transform CloudWatch events before sending (for example, to filter only selected fields or to use different field names).

There are two ways to install this Lambda function: using AWS Serverless Repository (recommended) or AWS Lambda Console.

### Filtering CloudWatch Events to send to SignalFx
After installation, this Lambda function will be triggered by a CloudWatch Event or a [CloudWatch Event rule](https://docs.aws.amazon.com/AmazonCloudWatch/latest/events/Create-CloudWatch-Events-Rule.html).
You should use the rules to filter the CloudWatch Events you want to be forwarded.

## Prerequisites
##### 1. Prepare SignalFx Access Token
To retrieve your [access token](https://docs.signalfx.com/en/latest/admin-guide/tokens.html#access-tokens):

* Open SignalFx and in the top, right corner, click your profile icon.
* Click Organization Settings > Access Tokens.
* [Choose an existing token](https://docs.signalfx.com/en/latest/admin-guide/tokens.html#view-and-copy-an-access-token) or [click "New token"](https://docs.signalfx.com/en/latest/admin-guide/tokens.html#create-an-access-token)
* Click the entry with the token and click "Show value"

This value will be later used as a SignalFx Access Token.

##### 2. Locate SignalFx Ingest Endpoint
By default, this Function will send data to the us0 realm. As a result, if you are not in the us0 realm, then you must explicitly set your realm.

To locate your realm:

* Open SignalFx and in the top, right corner, click your profile icon.
* Click My Profile.
* In the Organizations, Endpoints section, notice the value listed as "Real-time Data Ingest."

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
* Make sure to add the Lambda's IAM role as a Key User. 
If you do not yet know which role you will use for your Lambda function, you can modify the key later on, after the Lambda function is created.
If you install via Serverless Repository, we are going to perform this step for you.
* For overview and help on securing environment variables, consult the [AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html#configuration-envvars-encryption).
* Documentation on KMS encryption using the AWS CLI can be found [here](http://docs.aws.amazon.com/cli/latest/reference/kms/encrypt.html). 

Regardless of the key creation method, make sure you have access to the cipher text output as well as the key id of the encryption key you used.

## Installation
You can install this function in two ways:
* __Option 1) (Recommended)__ [From Serverless Application Repository](#option-1-recommended-install-from-serverless-application-repository) 
* __Option 2)__ [Manually with AWS Lambda Console](#option-2-manually-with-aws-lambda-console)

### Option 1: (Recommended) Install from Serverless Application Repository 

In this option, you will deploy an Application from Serverless Application Repository.
A Lambda Layer, Lambda Function, CloudWatch Event Rule and all necessary configurations will be created for you. 
This is a recommended and less time-consuming option.

__NOTE__: If you choose a version with token encryption, it will be by default configured to omit the events from `aws.kms`. 
The reason for this behavior is to avoid an infinite loop: when the lambda runs, it decrypts the token and thus generates a Cloudwatch Event.

#### Step 1: Locate the application in Serverless Application Repository
* Sign in to the AWS Management Console and open the [Serverless Application Repository console](https://console.aws.amazon.com/serverlessrepo/).
* Choose "Available Applications" and search for "SignalFx CloudWatch Event Forwarder" or "SignalFx CloudWatch Event Forwarder - encrypted" application.
* Click on the right application entry, depending if you wish to encrypt the token environment variable in transit.
#### Step 2: Fill out the Application Parameters  
* Set the `Application Name` to describe the application's purpose in your environment, for example `SignalFx CloudWatch Event Forwarder App`.
* Set the `EventSources` parameter to include the services from which you want to forward events to SignalFx.
Enter a comma delimited list to specify multiple services as sources, for example: `aws.ec2,aws.s3`. Please be aware that including `aws.lambda` may lead to invocation loop.

    Note: You will be later able to modify the Event Pattern in CloudWatch Events console.

* If you chose version without encryption, set `SignalFxAccessToken` to the SignalFx Access Token value you identified in Prerequisites.  
* If you chose version with encryption, set `EncryptedSignalFxAccessToken` to the value of SignalFx Access Token identified in Prerequisites encrypted with a prepared KMS key. 
Set the `KeyId` parameter to the Key Id of this key; it is the last section of the key's ARN.
* Set `SignalFxIngestEndpoint` parameter to the SignalFx Ingest Endpoint value you identified in Prerequisites.
* You may leave `SignalFxSendTimeout` parameter with a default value of 1000 ms.
* Acknowledge that the Application contains nested application. The nested application is a [SignalFx Lambda Wrapper for Node.js](https://github.com/signalfx/lambda-nodejs) deployed as a Lambda Layer.

#### Step 3: Deploy
* Click "Deploy". 
* You're ready! The integration is now configured. See [here](https://docs.signalfx.com/en/latest/detect-alert/events-intro.html) how to view and use events in SignalFx.
* (Optional) If you wish to modify any application parameters, you can now do so in AWS Console. You may be interested in modifying Lambda code or the CloudWatch Events rule which triggers the Lambda.


### Option 2: Manually with AWS Lambda Console
#### Overview
In this option, you will create a Lambda function and manually configure its dependencies, environment variables and a trigger. 
While more time consuming, it will give you better understanding of the inner workings of the process.

#### Step 1: Create a Lambda function in AWS Console

##### Step 1.1: Create a function
* Sign in to the AWS Management Console and open the [AWS Lambda console](https://console.aws.amazon.com/lambda/) and switch to the target region. Review the note below on choosing a region. 

   ###### NOTE: Choosing a region
   To benefit from the most convenient installation procedure, use one of the regions for which we provide a SignalFx Lambda Wrapper as Layer.
   To confirm that the region is supported, locate its Layer ARN [here](https://github.com/signalfx/lambda-layer-versions/blob/master/node/NODE.md). 
   If you wish to install in the region which is not supported, you can still do so, but you will need to deploy the copy of the Layer to your account, using Serverless Application Repository.
   The steps to accomplish this can be found [here](https://github.com/signalfx/lambda-nodejs#option-2-create-a-lambda-function-then-create-and-attach-a-layer-based-on-a-signalfx-template).

* Click "Create function" and choose the first option "Author from scratch".
* Enter a function name, for example `cloudwatch-event-forwarder`.
* Choose `Node 12.x` as a runtime.
* Let AWS create a new role with basic Lambda permissions or choose the existing role depending on how you manage permissions in your account.
* Click "Create function."

##### Step 1.2: Copy function code and set the handler
* Copy the contents of the [`cloudwatch-event-forwarder.js`](cloudwatch-event-forwarder.js) file to the Console Editor.
* Set the function handler to `index.handler`.

__NOTE:__ Alternative scripts:
Instead of the default [`cloudwatch-event-forwarder.js`](cloudwatch-event-forwarder.js) file, you can copy any of the following files if they better suit your needs: 
* If you don't intend to encrypt your token with KMS, you may use [`examples/cloudwatch-event-forwarder-no-encryption.js`](examples/cloudwatch-event-forwarder-no-encryption.js). The default forwarder will work, but the one without encryption has much simpler code.
* If you intend to change how events are sent (filter some fields only, change names etc.) and do not need encryption, use [`examples/cloudwatch-event-forwarder-custom.js`](examples/cloudwatch-event-forwarder-custom.js) as a base and change accordingly.
* Modify the handler name to reflect the naming in your function.

#### Step 2: Add a Layer to the function
* The forwarder uses [SignalFx Lambda Wrapper for Node.js](https://github.com/signalfx/lambda-nodejs) to connect to SignalFx.
The most convenient way to provide the wrapper is to use [AWS Lambda Layers](https://docs.aws.amazon.com/lambda/latest/dg/configuration-layers.html). 
In the configuration tab of the Lambda console, click the "Layers" panel and then "Add a layer" button. 
* Select "Provide a layer version ARN"
* Copy the Layer ARN in your region from [the list of available layers](https://github.com/signalfx/lambda-layer-versions/blob/master/node/NODE.md) and click "Add".
If you have chosen a region which is not supported, you can still add a layer, but you need to deploy a copy of the layer to your account first, which can be accomplished by following [the installation steps for the Lambda Wrapper](https://github.com/signalfx/lambda-nodejs#option-2-create-a-lambda-function-then-create-and-attach-a-layer-based-on-a-signalfx-template).

#### Step 3: Configure environment variables
##### Option 1) Setup without token encryption
* Set `SIGNALFX_AUTH_TOKEN` to the SignalFx Access Token value you identified when preparing Prerequisites.
* Set `SIGNALFX_INGEST_ENDPOINT` to the SignalFx Ingest Endpoint value you identified when preparing Prerequisites.
* Optionally, you can set `SIGNALFX_SEND_TIMEOUT` to a value in milliseconds. Default: 1000.

##### Option 2) Setup with token encryption
* Click "Edit" in the Environment Variables section.
* Expand "Encryption configuration" section and toggle "Enable helpers for encryption in transit". You may leave the default setting for encryption at rest.
* Add an `ENCRYPTED_SIGNALFX_AUTH_TOKEN` variable, set its value to the SignalFx Access Token identified when following the Prerequisites. Click "Encrypt" next to the variable and choose a key to perform the encryption.
* Set `SIGNALFX_INGEST_ENDPOINT` to the SignalFx Access Token value you identified when preparing Prerequisites.
* Optionally, you can set `SIGNALFX_SEND_TIMEOUT` to a value in milliseconds. Default: 1000.

#### Step 4: Add a trigger to the function
* In the Designer tab, click "Add trigger" button on the left.
* Choose "CloudWatch Events/ EventBridge" from the list in the dropdown
* Select CloudWatch Rule to filter desired events or create a new one. 
For help creating rules, consult [AWS documentation](https://docs.aws.amazon.com/lambda/latest/dg/services-cloudwatchevents.html).

__NOTE:__ the list of services available in the Lambda Designer is a short list of most common choices. 
If you need a richer editor and all the sources available, you can create the rule through CloudWatch Events console and select the target there.

#### Step 5: The integration is installed
You're ready! The integration is now configured. See [here](https://docs.signalfx.com/en/latest/detect-alert/events-intro.html) how to view and use events in SignalFx.

### Additional Information
#### Details on CloudWatch event to SignalFx Custom Event transformation
SignalFx Custom Event needs to be sent as a key-value map. This Lambda function will transform any CloudWatch event to conform to [naming and format restrictions of a SignalFx](https://developers.signalfx.com/ingest_data_reference.html#tag/Send-Custom-Events),
and then forward it to SignalFx.

If the default behavior does not suit your needs, please see [the examples on how to build and send SignalFx Custom Events.](./examples) 

By default, based on a Cloudwatch Event, this lambda will create a SignalFx Custom Event in a following way:

* event category will always be set to `USER_DEFINED`
* event type will always be set to `CloudWatch`
* `source`, `account`, `detail-type`, `region` keys which are common for all CloudWatch events and have a limited set of possible values will be sent as `dimensions` (`detail-type` will be sent as `detailType`)
* `time` property will be converted to Unix epoch time and sent as a timestamp of the SignalFx Custom Event.

Other keys will be transformed in the ways listed below and sent as `properties`:
* special characters in keys, such as `" "` (space), `":"` or `"/"` will be replaced with a `"_"` character. The allowed characters are `[a-zA-Z0-9\-_]`.
* `resources` array will be stringified.
* `id` will be copied as is.
* objects and arrays from `detail` section will be stringified and copied to the SignalFx Custom Event with a `"detail_"` prefix.
See exemplary transformation below.


For example, a sample CloudWatch event:

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
    "state":"pending",
    "obj": {"key": "val"}
  }
}
```
will be transformed to a Custom SignalFx Event:
```json
{
  "category":"USER_DEFINED",
  "eventType":"CloudWatch",
  "dimensions":{
    "detailType":"EC2 Instance State-change Notification",
    "source":"aws.ec2",
    "account":"123456789012",
    "region":"us-east-1"
  },
  "properties":{
    "id":"7bf73129-1428-4cd3-a780-95db273d1602",
    "resources":"[\"arn:aws:ec2:us-east-1:123456789012:instance/i-abcd1111\"]",
    "detail_instance-id":"i-abcd1111",
    "detail_state":"pending",
    "detail_obj":"{\"key\":\"val\"}"
  },
  "timestamp":1447277394000
}
```

#### Useful links:
* [Sending Custom Events to SignalFx](https://developers.signalfx.com/ingest_data_reference.html#operation/Send%20Custom%20Events)