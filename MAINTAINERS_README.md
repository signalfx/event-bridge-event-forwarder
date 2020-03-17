### Publishing the App in Serverless application repo:

1. Make necessary changes (if any) in `template.yaml` and `templateEncrypted.yaml`.
A typical change would be increasing a semantic version of a layer to use.

2. Run validation for both templates to make sure you have a correct syntax:
   ```bash
   sam validate --profile rnd --template template.yaml --region us-east-2

   sam validate --profile rnd --template templateEncrypted.yaml --region us-east-2

   ```

3. Run packaging:
   ```bash
   sam package --profile rnd --s3-bucket production-serverless-repo --s3-prefix cloudwatch-event-forwarder --region us-east-2 --template template.yaml --output-template-file packaged.yaml
   
   sam package --profile rnd --s3-bucket production-serverless-repo --s3-prefix cloudwatch-event-forwarder --region us-east-2 --template templateEncrypted.yaml --output-template-file packagedEncrypted.yaml
   ```

4. Publish the packaged file via AWS console
* Make sure you are in Ohio
* Go to Serverless Application Repository --> Published Applications --> Publish new version
* Description for the encrypted version:

`A Lambda function triggered by CloudWatch Events, which transforms a CloudWatch Event into SignalFx Custom Event and sends it to SignalFx. Supports encryption of a token variable.`

* Description for the base version:

`A Lambda function triggered by CloudWatch Events, which transforms a CloudWatch Event into SignalFx Custom Event and sends it to SignalFx.`

* Upload `AWS_README.md` as a README
* Choose Apache License 2.0
* Upload packaged.yaml/packagedEncrypted.yaml as a template file