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

    function updateTrackNotifications(payload) {
        try {
            if (!payload || !Array.isArray(payload.items)) {
                log.debug({
                    title: 'updateTrackNotifications',
                    details: 'Payload inválido ou items ausentes.'
                });
                return false;
            }

            if (payload.items.length === 0) {
                log.debug({
                    title: 'updateTrackNotifications',
                    details: 'Nenhum item recebido para atualização.'
                });
                return true;
            }

            var updatedCount = 0;
            var processedIds = {};

            payload.items.forEach(function (item) {
                if (!item || !item.notificationId) {
                    return;
                }

                var notificationId = item.notificationId;

                if (processedIds[notificationId]) {
                    return;
                }

                try {
                    var notificationRecord = record.load({
                        type: 'customrecord_pd_tno_track_notification',
                        id: notificationId,
                        isDynamic: false
                    });

                    if (item.name) {
                        notificationRecord.setValue({
                            fieldId: 'name',
                            value: item.name
                        });
                    }

                    if (item.status) {
                        notificationRecord.setValue({
                            fieldId: 'custrecord_pd_tno_status',
                            value: item.status
                        });
                    }

                    if (item.statusDate) {
                        var statusDateObj = parseDate(item.statusDate);
                        if (statusDateObj) {
                            notificationRecord.setValue({
                                fieldId: 'custrecord_pd_tno_status_date',
                                value: statusDateObj
                            });
                        }
                    }

                    if (item.estimatedDeliveryDate) {
                        var estimatedDateObj = parseDate(item.estimatedDeliveryDate);
                        if (estimatedDateObj) {
                            notificationRecord.setValue({
                                fieldId: 'custrecord_pd_tno_estimated_delivery_dat',
                                value: estimatedDateObj
                            });
                        }
                    }

                    if (item.historical) {
                        var historicalValue = item.historical;

                        if (typeof historicalValue === 'object') {
                            try {
                                historicalValue = JSON.stringify(historicalValue);
                            } catch (eJson) {
                                log.debug({
                                    title: 'updateTrackNotifications - historical stringify',
                                    details: 'Falha ao converter historical para JSON. Usando valor bruto. ID: ' + notificationId
                                });
                            }
                        }

                        notificationRecord.setValue({
                            fieldId: 'custrecord_pd_tno_historical',
                            value: historicalValue
                        });
                    }

                    notificationRecord.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });

                    processedIds[notificationId] = true;
                    updatedCount++;

                } catch (eItem) {
                    log.error({
                        title: 'updateTrackNotifications - erro ao atualizar notificationId ' + notificationId,
                        details: eItem
                    });
                }
            });

            log.debug({
                title: 'updateTrackNotifications - concluído',
                details: 'Registros atualizados: ' + updatedCount
            });

            return true;

        } catch (error) {
            log.error({
                title: 'updateTrackNotifications - erro inesperado',
                details: error
            });
            return false;
        }
    }

    return {
        updateTrackNotifications: updateTrackNotifications
    };

});
