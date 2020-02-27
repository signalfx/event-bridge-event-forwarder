'use strict';

const signalFxLambda = require('signalfx-lambda');

exports.handler = signalFxLambda.asyncWrapper(async (event, __) => {
  // filter events with CloudWatch Rule in AWS to trigger the lambda only for EC2
  if (event.source !== 'aws.ec2') {
    return Promise.reject('The source of the received event was not aws.ec2, but ', event.source);
  }

  // if there is a limited set of possible values, you can send key-value pairs as dimensions. Otherwise please use properties.
  let dimensions = {source: event.source, detailType: event['detail-type'], account: event.account};

  // if we handle only ec2 events, we can extract interesting properties from the event details
  let properties = {instance: event.detail['instance-id'], state: event.detail.state, region: event.region};
  return signalFxLambda.helper.sendCustomEvent('Custom', dimensions, properties);
});