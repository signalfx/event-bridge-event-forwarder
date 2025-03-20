// This code will transform Amazon EventBridge Event to SignalFx Custom Event and send it to the
// Splunk Observability Cloud (aka SignalFx) realm configured with environment variables. It uses SignalFx Lambda Wrapper.
// If you do not intend to encrypt your SIGNALFX_ACCESS_TOKEN, you can use much simpler cloudwatch-event-forwarder-no-encryption.js instead.

'use strict';

const signalFxLambda = require('signalfx-lambda'); // provided by the lambda layer
const { KMSClient, DecryptCommand } = require("@aws-sdk/client-kms"); // provided by the AWS lambda runtime

async function getToken() {
  if (!process.env.ENCRYPTED_SIGNALFX_ACCESS_TOKEN) {
    if (process.env.SIGNALFX_ACCESS_TOKEN) {
      return Promise.resolve(process.env.SIGNALFX_ACCESS_TOKEN);
    } else {
      return Promise.reject('Neither SIGNALFX_ACCESS_TOKEN nor ENCRYPTED_SIGNALFX_ACCESS_TOKEN is set');
    }
  }

  const tokenToDecrypt = Buffer.from(process.env.ENCRYPTED_SIGNALFX_ACCESS_TOKEN, 'base64');

  try {
    const command = new DecryptCommand({ CiphertextBlob: tokenToDecrypt });
    const kmsClient = new KMSClient();
    const data = await kmsClient.send(command);
    return data.Plaintext.toString();
  } catch (err) {
    throw err;
      }
}

// See ./examples for modifications of this function
const logic = async (event, context) => signalFxLambda.helper.sendCloudWatchEvent(event)
  .then(() => console.log('Event sent to SignalFx'))
  .catch(err => console.log('Unable to send the event to SignalFx', err));


exports.handler = async function (event, context) {
  try {
    const token = await getToken();
    const SignalFxWrapper = signalFxLambda.asyncWrapper(logic, {}, token);
    return SignalFxWrapper.call(this, event, context);
  } catch (err) {
    console.log('Error getting token', err);
  }
};
