/**
 * @NApiVersion 2.x
 * @ModuleScope Public
 * @author: Project Dome - Rogério Gonçalves Rodrigues
 */

define(
    [], 
    function () {

    function parseWebhookPayload(payload) {
        var logTitle = 'parseWebhookPayload';
        log.debug(logTitle, 'Raw Payload Received: ' + JSON.stringify(payload));

        var trackingNumber = payload.number || null;
        var carrier = payload.carrier || null;

        var trackInfo = payload.track_info || {};
        var latestEvent = trackInfo.latest_event || {};
        var latestStatus = trackInfo.latest_status || {};
        var estimatedDelivery = (payload.time_metrics && payload.time_metrics.estimated_delivery_date)
            ? payload.time_metrics.estimated_delivery_date.to
            : null;

        var historicalEvents = [];

        if (
            trackInfo.tracking &&
            trackInfo.tracking.providers &&
            Array.isArray(trackInfo.tracking.providers)
        ) {
            trackInfo.tracking.providers.forEach(function (provider) {
                if (provider.events && Array.isArray(provider.events)) {
                    provider.events.forEach(function (event) {
                        historicalEvents.push({
                            time: event.time_utc || '',
                            location: event.location || '',
                            description: event.description || '',
                            status: event.status || ''
                        });
                    });
                }
            });
        }

        if (Array.isArray(trackInfo.milestone)) {
            trackInfo.milestone.forEach(function (milestone) {
                historicalEvents.push({
                    time: milestone.time_utc || '',
                    location: milestone.location || '',
                    description: milestone.description || '',
                    status: milestone.status || ''
                });
            });
        }

        return {
            trackingNumber: trackingNumber,
            carrier: carrier,
            status: latestStatus.status || null,
            statusDate: latestEvent.time_utc || null,
            estimatedDeliveryDate: estimatedDelivery,
            historical: historicalEvents
        };
    }

    return {
        parseWebhookPayload: parseWebhookPayload
    };
});
