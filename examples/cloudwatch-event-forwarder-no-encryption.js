'use strict';

const signalFxLambda = require('signalfx-lambda');

exports.handler = signalFxLambda.asyncWrapper(async (event, __) => signalFxLambda.helper.sendCloudWatchEvent(event));