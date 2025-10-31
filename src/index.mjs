// This code will transform Amazon EventBridge Event to Splunk Observability Cloud Custom Event and send it to the
// Splunk Observability Cloud realm configured with environment variables.

'use strict';

import {buildApiConfig, sendEvent} from './splunk_observability_cloud_client.mjs';
import {convertEventBridgeEventToSplunkObservabilityCloudEvent} from './transform-helper.mjs';
import {DecryptCommand, KMSClient} from '@aws-sdk/client-kms'; // provided by the AWS lambda runtime

async function getApiConfig() {
    let apiHost = process.env.SPLUNK_OBSERVABILITY_CLOUD_ENDPOINT_URL;
    if (!apiHost && process.env.SPLUNK_OBSERVABILITY_CLOUD_INGEST_ENDPOINT) {
        console.log('SPLUNK_OBSERVABILITY_CLOUD_INGEST_ENDPOINT is deprecated. Please use SPLUNK_OBSERVABILITY_CLOUD_ENDPOINT_URL instead');
        apiHost = process.env.SPLUNK_OBSERVABILITY_CLOUD_INGEST_ENDPOINT;
    }

    const timeoutMaybe = Number(process.env.SPLUNK_OBSERVABILITY_CLOUD_SEND_TIMEOUT);
    const timeoutMs = !isNaN(timeoutMaybe) ? timeoutMaybe : 3000;

    const accessToken = await getAccessToken();

    return buildApiConfig(apiHost.trim() + '/v2/event', accessToken, timeoutMs);
}

async function getAccessToken() {
    if (process.env.ENCRYPTED_SPLUNK_OBSERVABILITY_CLOUD_ACCESS_TOKEN) {
        return getDecryptedAccessToken();
    }

    let accessToken = process.env.SPLUNK_OBSERVABILITY_CLOUD_ACCESS_TOKEN;
    if (!accessToken && process.env.SPLUNK_OBSERVABILITY_CLOUD_AUTH_TOKEN) {
        console.log('SPLUNK_OBSERVABILITY_CLOUD_AUTH_TOKEN is deprecated. Please use SPLUNK_OBSERVABILITY_CLOUD_ACCESS_TOKEN instead');
        accessToken = process.env.SPLUNK_OBSERVABILITY_CLOUD_AUTH_TOKEN;
    }
    if (accessToken) {
        return accessToken;
    }
    throw new Error('Neither SPLUNK_OBSERVABILITY_CLOUD_ACCESS_TOKEN nor ENCRYPTED_SPLUNK_OBSERVABILITY_CLOUD_ACCESS_TOKEN is set');
}

async function getDecryptedAccessToken() {
    const tokenToDecrypt = Buffer.from(process.env.ENCRYPTED_SPLUNK_OBSERVABILITY_CLOUD_ACCESS_TOKEN, 'base64');

    const command = new DecryptCommand({CiphertextBlob: tokenToDecrypt});
    const kmsClient = new KMSClient();
    const data = await kmsClient.send(command);
    const token = new TextDecoder().decode(data.Plaintext).trim();
    return token;
}

// retrieve API config just once during cold start and reuse it later to minimise invocation time
const apiConfig = await getApiConfig();

async function handler(event, context) {
    try {
        if (!(event.source && event.account && event.region && event['detail-type'])) {
            console.warn('Ignoring non EventBridge event', event);
            return;
        }
        const convertedEvent = convertEventBridgeEventToSplunkObservabilityCloudEvent(event);
        return await sendEvent(apiConfig, convertedEvent);
    } catch (err) {
        console.error('Error processing event', event, err);
        throw err;
    }
}

export {
    handler
}
