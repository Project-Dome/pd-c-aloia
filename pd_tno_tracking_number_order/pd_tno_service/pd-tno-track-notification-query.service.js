/**
 * @NApiVersion 2.1
 * @NModuleScope SameAccount
 * @author Rogério Gonçalves Rodrigues - Project Dome
 */

define([
    'N/query',
    'N/log'
], function (
    query,
    log
) {

    function existsNotification(carrierCode, trackingNumber) {
        log.debug('linha 16 - existsNotification - carrierCode', carrierCode);
        log.debug('linha 17 - existsNotification - trackingNumber', trackingNumber);

        try {
            if (!carrierCode || !trackingNumber) {
                return {
                    exists: false,
                    notificationId: null
                };
            }

            // var sql = `
            //     SELECT id
            //     FROM customrecord_pd_tno_track_notification
            //     WHERE custrecord_pd_tno_tracking_number = ?
            //       AND custrecord_pd_tno_carrier = ?
            //     ORDER BY id DESC
            // `;

            var sql = `
                SELECT id
                FROM customrecord_pd_tno_track_notification
                WHERE custrecord_pd_tno_tracking_number = ?
                ORDER BY id DESC
            `;

            var resultSet = query.runSuiteQL({
                query: sql,
                // params: [trackingNumber, carrierCode]
                params: [trackingNumber]
            });

            var results = resultSet.asMappedResults() || [];
            log.debug('linha 48 - existsNotification - results', results);

            if (results.length > 0 && results[0].id) {
                return {
                    exists: true,
                    notificationId: Number(results[0].id)
                };
            }

            return {
                exists: false,
                notificationId: null
            };

        } catch (e) {
            log.error({
                title: 'existsNotification - erro',
                details: e
            });

            return {
                exists: false,
                notificationId: null
            };
        }
    }

    return {
        existsNotification: existsNotification
    };
});
