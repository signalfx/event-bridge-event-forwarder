'use strict';

const signalFxLambda = require('signalfx-lambda');
const aws = require('aws-sdk');
const kms = new aws.KMS();

async function setToken() {
  const tokenToDecrypt = Buffer.from(process.env.ENCRYPTED_SIGNALFX_AUTH_TOKEN, 'base64');
  if (!tokenToDecrypt) {
    if (process.env.SIGNALFX_AUTH_TOKEN) {
      return Promise.resolve();
    } else {
      return Promise.reject('Neither SIGNALFX_AUTH_TOKEN nor ENCRYPTED_SIGNALFX_AUTH_TOKEN is set');
    }
  }

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

const logic = async (event, context) => signalFxLambda.helper.sendCloudwatchEvent(event)
  .then(() => console.log('event sent to SignalFx'))
  .catch(err => console.log('Unable to send the event to SignalFx', err));


exports.handler = async function (event, context) {
  return setToken().then(token => {
    let SignalFxWrapper = signalFxLambda.asyncWrapper(logic, {}, token);
    return SignalFxWrapper.call(this, event, context);
  });
};

