/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Rogério Gonçalves Rodrigues
 */


define(['N/record', 'N/log'], function (record, log) {

    function updateTrackNotifications(notifications) {
        try {
            notifications.forEach(function (notification) {
                if (!notification || !notification.id || !notification.fields) return;

                var notificationRecord = record.load({
                    type: 'customrecord_pd_tno_track_notification',
                    id: notification.id,
                    isDynamic: false
                });

                Object.keys(notification.fields).forEach(function (fieldId) {
                    var value = notification.fields[fieldId];

                    if (value != null) {
                        notificationRecord.setValue({
                            fieldId: fieldId,
                            value: value
                        });
                    }
                });

                notificationRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.debug({
                    title: 'updateTrackNotifications - registro atualizado',
                    details: 'notificationId: ' + notification.id
                });
            });

            return true;

        } catch (error) {
            log.error({
                title: 'updateTrackNotifications - erro',
                details: error
            });
            return false;
        }
    }

    function updateSingleNotification(notificationId, values) {
        try {
            if (!notificationId || !values || typeof values !== 'object') {
                log.debug({
                    title: 'updateSingleNotification',
                    details: 'Parâmetros inválidos: notificationId ou values ausentes/incorretos.'
                });
                return false;
            }

            var notificationRecord = record.load({
                type: 'customrecord_pd_tno_track_notification',
                id: notificationId,
                isDynamic: false
            });

            Object.keys(values).forEach(function (fieldId) {
                var value = values[fieldId];

                if (value != null) {
                    notificationRecord.setValue({
                        fieldId: fieldId,
                        value: value
                    });
                }
            });

            notificationRecord.save({
                enableSourcing: false,
                ignoreMandatoryFields: true
            });

            log.debug({
                title: 'updateSingleNotification - registro atualizado',
                details: 'notificationId: ' + notificationId
            });

            return true;

        } catch (error) {
            log.error({
                title: 'updateSingleNotification - erro',
                details: error
            });
            return false;
        }
    }

    return {
        updateTrackNotifications: updateTrackNotifications,
        updateSingleNotification: updateSingleNotification
    };
});
