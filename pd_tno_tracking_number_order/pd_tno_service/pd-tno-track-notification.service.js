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

    function parseDate(value) {
        if (!value) {
            return null;
        }

        if (Object.prototype.toString.call(value) === '[object Date]') {
            return value;
        }

        var str = String(value).trim();

        if (!str) {
            return null;
        }

        if (str.indexOf('T') > -1) {
            str = str.split('T')[0]; // 2025-12-08
        }

        var year, month, day;

        if (str.indexOf('-') > -1) {
            var partsDash = str.split('-'); // YYYY-MM-DD
            if (partsDash.length === 3) {
                year = parseInt(partsDash[0], 10);
                month = parseInt(partsDash[1], 10) - 1;
                day = parseInt(partsDash[2], 10);
                return new Date(year, month, day);
            }
        }

        if (str.indexOf('/') > -1) {
            var partsSlash = str.split('/'); // M/D/YYYY
            if (partsSlash.length === 3) {
                month = parseInt(partsSlash[0], 10) - 1;
                day = parseInt(partsSlash[1], 10);
                year = parseInt(partsSlash[2], 10);
                return new Date(year, month, day);
            }
        }

        return null;
    }

    function createTrackNotification(data) {
        try {
            if (!data) {
                log.debug({
                    title: 'createTrackNotification',
                    details: 'Nenhum dado recebido.'
                });
                return null;
            }

            var trackingNumber = data.trackingNumber;
            var carrier = data.carrier;
            var originTransaction = data.originTransaction;

            if (!trackingNumber || !carrier || !originTransaction) {
                log.debug({
                    title: 'createTrackNotification - validação',
                    details: 'Campos obrigatórios ausentes (trackingNumber, carrier ou originTransaction). Dados: ' + JSON.stringify(data)
                });
                return null;
            }

            var notificationRecord = record.create({
                type: 'customrecord_pd_tno_track_notification',
                isDynamic: false
            });

            if (data.name) {
                notificationRecord.setValue({
                    fieldId: 'name',
                    value: data.name
                });
            }

            notificationRecord.setValue({
                fieldId: 'custrecord_pd_tno_tracking_number',
                value: trackingNumber
            });

            notificationRecord.setValue({
                fieldId: 'custrecord_pd_tno_carrier',
                value: carrier
            });

            if (data.status) {
                notificationRecord.setValue({
                    fieldId: 'custrecord_pd_tno_status',
                    value: data.status
                });
            }

            if (data.statusDate) {
                var statusDateObj = parseDate(data.statusDate);
                if (statusDateObj) {
                    notificationRecord.setValue({
                        fieldId: 'custrecord_pd_tno_status_date',
                        value: statusDateObj
                    });
                }
            }

            if (data.estimatedDeliveryDate) {
                var estimatedDateObj = parseDate(data.estimatedDeliveryDate);
                if (estimatedDateObj) {
                    notificationRecord.setValue({
                        fieldId: 'custrecord_pd_tno_estimated_delivery_dat',
                        value: estimatedDateObj
                    });
                }
            }

            if (data.historical) {
                var historicalValue = data.historical;

                if (typeof historicalValue === 'object') {
                    try {
                        historicalValue = JSON.stringify(historicalValue);
                    } catch (eJson) {
                        log.debug({
                            title: 'createTrackNotification - historical stringify',
                            details: 'Falha ao converter historical para JSON. Usando valor bruto.'
                        });
                    }
                }

                notificationRecord.setValue({
                    fieldId: 'custrecord_pd_tno_historical',
                    value: historicalValue
                });
            }

            notificationRecord.setValue({
                fieldId: 'custrecord_pd_tno_origin_transaction',
                value: originTransaction
            });

            var newNotificationId = notificationRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            log.debug({
                title: 'createTrackNotification - criado',
                details: 'ID: ' + newNotificationId + ' | Dados: ' + JSON.stringify(data)
            });

            return newNotificationId;

        } catch (error) {
            log.error({
                title: 'createTrackNotification - erro inesperado',
                details: error
            });
            return null;
        }
    }

    return {
        createTrackNotification: createTrackNotification
    };

});
