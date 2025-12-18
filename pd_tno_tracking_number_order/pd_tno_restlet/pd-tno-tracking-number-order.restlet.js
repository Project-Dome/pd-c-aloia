/**
 *@NApiVersion 2.x
 *@NScriptType Restlet
 *@author Project Dome - Rogério Gonçalves Rodrigues
 */

define(
  ['N/runtime',
    'N/log',

    '../pd_tno_service/pd-tno-parse-webhook-payload.service.js',
    '../pd_tno_service/pd-tno-track-notification-query.service.js',
    '../pd_tno_service/pd-tno-track-notification-update.service.js'

  ],
  function (
    runtime,
    log,

    webhook_payload_service,
    track_notification_query_service,
    track_notification_update_service

  ) {

    function doPost(payload) {
      var logTitle = 'RESTlet 17TRACK';
      log.debug(logTitle, 'Webhook recebido: ' + JSON.stringify(payload));

      try {
        var parsed = webhook_payload_service.parseWebhookPayload(payload);
        log.debug(logTitle, 'Dados extraídos do webhook: ' + JSON.stringify(parsed));

        if (!parsed.trackingNumber || !parsed.carrier) {
          log.error(logTitle, 'Dados ausentes: trackingNumber ou carrier');
          return { success: false, message: 'Dados incompletos no webhook' };
        }

        var notificationId = track_notification_query_service.existsNotification(
          parsed.trackingNumber,
          parsed.carrier
        );

        if (!notificationId) {
          log.error(logTitle, 'Notificação não encontrada para: ' + parsed.trackingNumber);
          return { success: false, message: 'Registro não localizado' };
        }

        track_notification_update_service.updateSingleNotification(notificationId, {
          status: parsed.status,
          statusDate: parsed.statusDate,
          estimatedDeliveryDate: parsed.estimatedDeliveryDate,
          historical: parsed.historical
        });

        log.audit(logTitle, 'Notificação atualizada com sucesso: ' + notificationId);

        return { success: true };

      } catch (e) {
        log.error(logTitle, 'Erro inesperado: ' + e.message, e);
        return { success: false, message: e.message };
      }
    }


    return {
      post: doPost
    };
  });
