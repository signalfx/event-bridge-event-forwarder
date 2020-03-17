'use strict';

const signalFxLambda = require('signalfx-lambda');

exports.handler = signalFxLambda.asyncWrapper(async (event, context) => {
  // if there is a limited set of possible values, you can send key-value pairs as dimensions. Otherwise please use properties.
  let dimensions = {source: event.source, account: event.account};

  let properties = {functionName: context['function-name'], detailType: event['detail-type']};
  return signalFxLambda.helper.sendCustomEvent('Custom', dimensions, properties);
});