# Publishing the App in Serverless Application Repository
## Prerequisites
1. Install [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/install-sam-cli.html#install-sam-cli-instructions)
2. Configure AWS CLI using account that has access to publish in Serverless Application Repository.
   ```bash
   aws configure --profile rnd
   ```

## Prepare release

1. Make necessary changes (if any) in `template.yaml` and `templateEncrypted.yaml`.

2. Run validation for both templates to make sure you have a correct syntax:
   ```bash
   sam validate --profile rnd --template template.yaml --region us-east-2

   sam validate --profile rnd --template templateEncrypted.yaml --region us-east-2

   ```

3. Run packaging:
   ```bash
   sam package --profile rnd --s3-bucket production-serverless-repo --s3-prefix event-bridge-event-forwarder --region us-east-2 --template template.yaml --output-template-file packaged.yaml
   
   sam package --profile rnd --s3-bucket production-serverless-repo --s3-prefix event-bridge-event-forwarder --region us-east-2 --template templateEncrypted.yaml --output-template-file packagedEncrypted.yaml
   ```

4. Run `.generate_aws_readme.sh` to generate `AWS_README.md` (if changes were made to README.md, otherwise you can skip this step).

## Publish the packaged file via AWS console
* Make sure you are in Ohio 
* Go to Serverless Application Repository --> Published Applications

Option 1 - Update existing application
1. Open application `splunk-observability-cloud-event-bridge-event-forwarder` (`splunk-observability-cloud-event-bridge-event-forwarder-encrypted` for encrypted version)
2. Versions --> Publish new version
3. Fill in the semantic version (e.g., 1.0.0) and upload `packaged.yaml`/`packagedEncrypted.yaml` as a SAM template file
4. Publish version
5. If necessary edit Application details
6. If necessary go to Readme tab and upload `AWS_README.md`

Option 2 - Create new application
1. Click on "Publish application"
2. Fill in Application Name
3. Put `Splunk Observability Cloud` as Author
4. Fill in Description:
* Description for the encrypted version:

`A Lambda function triggered by EventBridge Events, which transforms an EventBridge Event into Splunk Observability Cloud Custom Event and sends it to Splunk Observability Cloud. Supports encryption of a token variable.`

* Description for the base version:

`A Lambda function triggered by EventBridge Events, which transforms an EventBridge Event into Splunk Observability Cloud Custom Event and sends it to Splunk Observability Cloud.`

5. Upload `AWS_README.md` as a README 
6. Fill in the semantic version (e.g., 1.0.0)
6. Choose `Apache License 2.0`
7. Upload `packaged.yaml`/`packagedEncrypted.yaml` as a template file