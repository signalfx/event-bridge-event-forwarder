'use strict';

const MAX_FIELD_NAME_LENGTH = 128;
const DETAIL_PREFIX = 'detail_';

function isPrimitive(x) {
    return Object(x) !== x;
}

function sanitize(name) {
    let sanitizedName = name.replace(/[^a-zA-Z0-9\-_]+/gi, '_');
    if (name.length > MAX_FIELD_NAME_LENGTH) {
        sanitizedName = sanitizedName.substring(0, MAX_FIELD_NAME_LENGTH);
    }
    return sanitizedName;
}

function extractSanitizedEventDetails(eventBridgeEvent) {
    let detailsMap = {};
    if (!eventBridgeEvent.detail) {
        return detailsMap;
    }
    for (let [key, value] of Object.entries(eventBridgeEvent.detail)) {
        let sanitizedKey = sanitize(DETAIL_PREFIX + key);
        if (value == null || typeof value == 'boolean' || !isPrimitive(value)) {
            detailsMap[sanitizedKey] = JSON.stringify(value);
        } else {
            detailsMap[sanitizedKey] = value;
        }
    }
    return detailsMap;
}

function toUnixTime(dateString) {
    const date = dateString ? new Date(dateString) : new Date();
    return date.getTime();
}

function convertEventBridgeEventToSplunkObservabilityCloudEvent(ebEvent) {
    const detailsMap = extractSanitizedEventDetails(ebEvent);

    const sfxEvent = {
        category: 'USER_DEFINED',
        eventType: 'EventBridge',
        dimensions: {
            region: ebEvent.region,
            account: ebEvent.account,
            detailType: ebEvent['detail-type'],
            source: ebEvent.source,
        },
        properties: Object.assign(
            {id: ebEvent.id, version: ebEvent.version},
            detailsMap,
            {resources: JSON.stringify(ebEvent.resources)}
        ),
        timestamp: toUnixTime(ebEvent.time),
    };

    return sfxEvent;
}

export {
    convertEventBridgeEventToSplunkObservabilityCloudEvent
}