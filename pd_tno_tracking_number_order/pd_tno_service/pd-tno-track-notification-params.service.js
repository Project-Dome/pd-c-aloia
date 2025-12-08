/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Rogério Gonçalves Rodrigues
 */

define([
    'N/record',
    'N/log'
], function (
    record,
    log
) {

    function formatIsoToMDYYYY(value) {
        if (!value) {
            return null;
        }

        var str = String(value);

        // Se vier com hora, ex: 2025-12-08T14:21:48Z → pega só a parte de data
        if (str.indexOf('T') > -1) {
            str = str.split('T')[0]; // 2025-12-08
        }

        // Espera YYYY-MM-DD
        if (str.indexOf('-') > -1) {
            var parts = str.split('-'); // [yyyy, mm, dd]
            if (parts.length === 3) {
                var yyyy = parts[0];
                var mm = String(parseInt(parts[1], 10)); // remove zero à esquerda
                var dd = String(parseInt(parts[2], 10)); // remove zero à esquerda
                return mm + '/' + dd + '/' + yyyy;       // M/D/YYYY
            }
        }

        return str;
    }

    function cloneHistoricalWithFormattedDate(payloadItem) {
        if (!payloadItem) {
            return null;
        }

        // clone simples
        var historical = JSON.parse(JSON.stringify(payloadItem));

        if (historical.latestSyncTime) {
            historical.latestSyncTime = formatIsoToMDYYYY(historical.latestSyncTime);
        }

        return historical;
    }

    function getTrackNotificationParams(purchaseOrderId, payloadFinal) {
        try {
            if (!purchaseOrderId || !payloadFinal || !Array.isArray(payloadFinal.items)) {
                return null;
            }

            var purchaseOrder = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: purchaseOrderId,
                isDynamic: false
            });

            var itemSublistId = 'item';
            var lineCount = purchaseOrder.getLineCount({ sublistId: itemSublistId });

            if (!lineCount) {
                return {
                    purchaseOrderId: purchaseOrderId,
                    createItems: [],
                    updateItems: []
                };
            }

            var payloadByLineRef = {};
            payloadFinal.items.forEach(function (item) {
                if (item && item.lineReference) {
                    payloadByLineRef[String(item.lineReference)] = item;
                }
            });

            var createItems = [];
            var updateItems = [];

            for (var line = 0; line < lineCount; line++) {
                var lineReference = purchaseOrder.getSublistValue({
                    sublistId: itemSublistId,
                    fieldId: 'custcol_pd_cso_line_reference',
                    line: line
                });

                var trackingNumber = purchaseOrder.getSublistValue({
                    sublistId: itemSublistId,
                    fieldId: 'custcol_pd_tno_track_nmb_order_line',
                    line: line
                });

                var carrier = purchaseOrder.getSublistValue({
                    sublistId: itemSublistId,
                    fieldId: 'custcol_pd_17track_tracking_carrier',
                    line: line
                });

                var notificationId = purchaseOrder.getSublistValue({
                    sublistId: itemSublistId,
                    fieldId: 'custcol_pd_tno_track_notification_id',
                    line: line
                });

                var status = purchaseOrder.getSublistValue({
                    sublistId: itemSublistId,
                    fieldId: 'custcol_pd_tno_tracking_status',
                    line: line
                });

                var estimatedDeliveryColumn = purchaseOrder.getSublistValue({
                    sublistId: itemSublistId,
                    fieldId: 'custcol_pd_tno_estimated_delivery_dat',
                    line: line
                });

                if (!trackingNumber || !carrier) {
                    continue;
                }

                var payloadItem = lineReference && payloadByLineRef[String(lineReference)]
                    ? payloadByLineRef[String(lineReference)]
                    : null;

                // latestSyncTime → somente data em M/D/YYYY
                var rawStatusDate = payloadItem ? payloadItem.latestSyncTime : null;
                var statusDate = formatIsoToMDYYYY(rawStatusDate);

                // estimatedDeliveryDate → também normalizado para M/D/YYYY
                var rawEstimatedDelivery = (payloadItem && payloadItem.estimatedDeliveryDate !== undefined)
                    ? payloadItem.estimatedDeliveryDate
                    : estimatedDeliveryColumn;

                var estimatedDeliveryDate = formatIsoToMDYYYY(rawEstimatedDelivery);

                // histórico com latestSyncTime já formatado
                var historical = cloneHistoricalWithFormattedDate(payloadItem);

                var name = status || '';
                if (estimatedDeliveryDate) {
                    name = name ? (name + ' - ' + estimatedDeliveryDate) : estimatedDeliveryDate;
                }

                var baseData = {
                    line: line,
                    lineReference: lineReference,
                    trackingNumber: trackingNumber,
                    carrier: carrier,
                    notificationId: notificationId,
                    status: status,
                    statusDate: statusDate,
                    estimatedDeliveryDate: estimatedDeliveryDate,
                    historical: historical,
                    name: name
                };

                if (!notificationId) {
                    createItems.push({
                        line: baseData.line,
                        name: baseData.name,
                        trackingNumber: baseData.trackingNumber,
                        carrier: baseData.carrier,
                        status: baseData.status,
                        statusDate: baseData.statusDate,
                        estimatedDeliveryDate: baseData.estimatedDeliveryDate,
                        historical: baseData.historical,
                        originTransaction: purchaseOrderId
                    });
                } else {
                    updateItems.push({
                        notificationId: baseData.notificationId,
                        name: baseData.name,
                        status: baseData.status,
                        statusDate: baseData.statusDate,
                        estimatedDeliveryDate: baseData.estimatedDeliveryDate,
                        historical: baseData.historical
                    });
                }
            }

            return {
                purchaseOrderId: purchaseOrderId,
                createItems: createItems,
                updateItems: updateItems
            };

        } catch (error) {
            log.error({
                title: 'getTrackNotificationParams Error',
                details: error
            });
            return null;
        }
    }

    return {
        getTrackNotificationParams: getTrackNotificationParams
    };

});
