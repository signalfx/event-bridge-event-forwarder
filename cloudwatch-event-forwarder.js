// This code will transform CloudWatch Event to SignalFx Custom Event and send it to the
// SignalFx realm configured with environment variables. It uses SignalFx Lambda Wrapper.
// If you do not intend to encrypt your SIGNALFX_ACCESS_TOKEN, you can use much simpler cloudwatch-event-forwarder-no-encryption.js instead.

'use strict';

const signalFxLambda = require('signalfx-lambda');
const aws = require('aws-sdk');
const kms = new aws.KMS();

async function setToken() {
  if (!process.env.ENCRYPTED_SIGNALFX_ACCESS_TOKEN) {
    if (process.env.SIGNALFX_ACCESS_TOKEN) {
      return Promise.resolve(process.env.SIGNALFX_ACCESS_TOKEN);
    } else {
      return Promise.reject('Neither SIGNALFX_ACCESS_TOKEN nor ENCRYPTED_SIGNALFX_ACCESS_TOKEN is set');
    }
  }

  const tokenToDecrypt = Buffer.from(process.env.ENCRYPTED_SIGNALFX_ACCESS_TOKEN, 'base64');
  return new Promise((resolve, reject) => {
    const params = {
      CiphertextBlob: tokenToDecrypt
    };
    kms.decrypt(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Plaintext.toString());
      }
    });
  });
}

// See ./examples for modifications of this function
const logic = async (event, context) => signalFxLambda.helper.sendCloudWatchEvent(event)
  .then(() => console.log('Event sent to SignalFx'))
  .catch(err => console.log('Unable to send the event to SignalFx', err));


exports.handler = async function (event, context) {
  return setToken().then(token => {

    let SignalFxWrapper = signalFxLambda.asyncWrapper(logic, {}, token);
    return SignalFxWrapper.call(this, event, context);
  });
};
