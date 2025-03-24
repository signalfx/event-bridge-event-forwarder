'use strict';

function buildApiConfig(endpointUrl, accessToken, timeoutMs) {
    return {
        endpointUrl, accessToken, timeoutMs
    }
}

async function sendEvent(apiConfig, event) {
    if (!event?.category || !event?.eventType) {
        throw new Error('category and eventType should not be empty');
    }

    const request = {
        method: 'POST',
        body: JSON.stringify([event]),
        signal: AbortSignal.timeout(apiConfig.timeoutMs || 3000)
    };
    const headers = {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'fetch-based-sfx-client',
            'X-SF-Token': apiConfig.accessToken
        }
    }
    const response = await fetch(apiConfig.endpointUrl, {...request, ...headers});
    if (response.status >= 200 && response.status < 300) {
        return response.status;
    }
    throw new Error(`failed to POST ${apiConfig.endpointUrl} data ${request.body} - got response ${response.status} ${await response.text()}`)
}

export {
    buildApiConfig,
    sendEvent
}
