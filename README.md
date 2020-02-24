# SignalFx Cloudwatch Event Forwarder

These instructions will describe the steps to deploy the Lambda function to forward your Cloudwatch and Cloudtrail events to SignalFx as Custom Events.
You can choose to deploy the function either from the Serverless Application Repository (recommended) or from source. 
Choose a deployment method and follow the steps below to encrypt your SignalFx access token, and create and deploy the new function.

#### Note: Modifying the behavior of the SignalFx Cloudwatch Event Forwarder
If the default behavior of SignalFx Cloudwatch Event Forwarder does not suit your needs, based on our examples, you can easily modify it by using a "sendCustomEvent" method of SignalFx lambda wrapper and deploy your own version of the forwarder.



#### Note: Encryption of your SignalFx access token
This Lambda function uses your SignalFx access token to send events to SignalFx, as an environment variable to the function. 
While Lambda encrypts all environment variables at rest and decrypts them upon invocation, AWS recommends that all sensitive information such as access tokens be encrypted using a KMS key before function deployment, and decrypted at runtime within the code.

Both procedures below include instructions for using either an encrypted or non-encrypted access token.

# Deploying through the Serverless Application Repository
1. Set up an encryption key and encrypt your access token (if desired)
Only follow this step if you chose to manually encrypt your access token. Either create a new KMS encryption key or select a preexisting one. The key must be in the same availability zone as the lambda function you will deploy.
You can create and manage encryption keys from IAM in the AWS management console. 
Documentation on KMS encryption from the CLI can be found here. 
Make sure you have access to the cipher text output by the encryption as well as the key id of the encryption key you used.

2. Create the Lambda function
Click Create Function from the list of Lambda functions in your AWS console.
Make sure you are in the intended availability zone. 
Select the Serverless Application Repository option in the upper right hand corner. 
Search for signalfx-cloudwatch-events forwarder and choose the appropriate entry based on whether you encrypted your access token.

To access the templates directly, find the template for encrypted access tokens here. The template for non-encrypted access tokens is here.

3. Fill out application parameters
Under Configure application parameters, choose a name for your function, and fill out the fields accordingly.

Parameters for template using encrypted access tokens

EncryptedSignalFxAuthToken: The Ciphertext blob output from your encryption of your SignalFx organization's access token
KeyId: The key id of your KMS encryption key; it is the last section of the key's ARN.
Realm: Your SignalFx Realm. To determine what realm you are in, check your profile page in the SignalFx web application. Default: us0.

Parameters for template using non-encrypted access tokens

SignalFxAuthToken: Your SignalFx organization's access token.
SignalFxIngestEndpoint: Your SignalFx realm. To determine what realm you are in, check your profile page in the SignalFx web application. Default: ingest.us0.signalfx.com.
SignalFxSendTimeout: Send timeout in seconds. Default: 5.0.

A note on SignalFx realms:
A realm is a self-contained deployment of SignalFx in which your organization is hosted. Different realms have different API endpoints.
For example, the endpoint for sending data in the us1 realm is ingest.us1.signalfx.com, and ingest.eu0.signalfx.com for the eu0 realm. If you try to send data to the incorrect realm, your access token will be denied.

4. Deploy function and configure trigger
Click Deploy. Once the function has finished deploying, navigate to the function's main page.

Under the Configuration tab, scroll through the list on the left and select CloudWatch Events as the source of the trigger. 
Below there will be specific configurations for the trigger, which you can use to filter the events which you wish to forward to SignalFx.
Make sure the Enabled switch is activated.
Click Add, then click Save in the upper right corner.

That's it! Your Cloudwatch Events are on the way to SignalFx ingest!

# Deploying from source
1. Set up the execution role
The execution role just needs basic Lambda execution permissions and KMS decrypt permissions (if you wish to encrypt your SignalFx access token). If you don't want to create one, you can select from a list of templates when you create the lambda function.

2. Set up an encryption key and encrypt access token
Only follow this step if you chose to encrypt your access token. Either create a new KMS encryption key or select a preexisting one. The key must be in the same availability zone as the RDS instances you are monitoring. You can create and manage encryption keys from IAM in the AWS management console. Documentation on KMS encryption from the CLI can be found here. Make sure you have access to the cipher text output by the encryption as well as the key id of the encryption key you used.

3. Clone the source repo and build the deployment package
You can find the repo here. Once you have cloned the repo:

$ cd enhanced-rds-monitoring
$ ./build.sh
The package will be named enhanced_rds.zip. This will be the file to upload for the Lambda.

4. Create and configure the Lambda function
From the Lambda creation screen, make sure you have selected Build from scratch. Select a name for your function. For Runtime select Python3.8 (although Python3.6 and Python3.7 are also supported). For the execution role, either select the role you wish to use or select Create from Template and add KMS decrypt permissions if need be. You will also need to choose a name for the role.

For subsequent tabs, follow the instructions below.

Designer
The only thing to be done here is set up the trigger from CloudWatch Logs. Select CloudWatch Logs from the list on the left. Below, a section labelled Configure triggers will appear. For the Log group field, select RDSOSMetrics. You must also choose a filter name, but leave the filter pattern blank. You can disable the trigger to start if you wish (though you will need to manually enable it later to start sending metrics), then click Add.

Function code
Once the function is created you can change the configurations. Upload the ZIP file containing the deployment package. Change the text in Handler to be enhanced_rds.lambda_script.lambda_handler.

Environment variables
First create an environment variable called groups. This will store the list of metric groups to be reported. To report all available metrics, enter All. Otherwise, list the names of desired metric groups, spelled exactly as above, separated by single spaces.

Next create a variable to store your SignalFx access token. Create a field called encrypted_access_token to store an encrypted SignalFx access token, or simply access_token to store an unencrypted token. Paste your access token into the value field.

If you use encrypted_access_token, follow the steps below to encrypt it:

Under Encryption configuration, check the box to Enable helpers for encryption in transit. A new field will appear labelled KMS key to encrypt in transit.
Select the encryption key you wish to use from the dropdown. A button labelled Encrypt will appear next to your environment variables.
Click the Encrypt button next to encrypted_access_token once. The value will be replaced by a Ciphertext blob.
If you are not in the us0 realm in SignalFx, you will need to specify a realm environment variable. To determine which realm you are in, check your profile page in the SignalFx web application.

Basic settings
Under basic settings, set Timeout to 0 min 5 sec.

Click Save, and once the trigger is enabled, your function will start sending your metrics to SignalFx!

Metric groups collected by this integration
The following metric groups are collected by this integration. To collect all of them, use All at configuration time. To select a subset, choose metric groups by name. You can find documentation on the available metrics here.

