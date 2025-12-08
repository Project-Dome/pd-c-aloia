/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * @author Rogério Gonçalves Rodrigues
 *
 */


define([
    'N/https',
    'N/record',
    'N/log',

    '../pd_tno_service/pd-tno-track-carriers.service',
    '../pd_tno_service/pd-tno-gettrackinfo.service.js',
    '../pd_tno_service/pd-tno-get-tracking-data.service.js',
    '../pd_tno_service/pd-tno-update-tracking-status-informations.service.js',
    '../pd_tno_service/pd-tno-register-return.service.js',
    '../pd_tno_service/pd-tno-po-tracking-columns.service.js',
    '../pd_tno_service/pd-tno-track-notification.service.js',
    '../pd_tno_service/pd-tno-track-notification-update.service.js',
    '../pd_tno_service/pd-tno-track-notification-params.service.js'
],
    function (
        https,
        record,
        log,

        carrier_service,
        gettrackinfo_service,
        gettrackdata_service,
        update_tracking_service,
        update_register_return_service,
        poTrackingColumns_service,
        track_notification_service,
        track_notification_update_service,
        track_notification_params_service

    ) {

        const API_URL = 'https://api.17track.net/track/v2.4/register';
        // const GET_INFORMATION_URL = 'https://api.17track.net/track/v2.4/gettrackinfo';
        const API_TOKEN = '619A48177643591590C8820BEB0B4AA0'; //Criar record type para armazenar valor.

        function beforeLoad(context) {
            try {

                // Só roda no modo VIEW
                if (context.type !== context.UserEventType.VIEW) {
                    return;
                }

                const purchaseOrderId = context.newRecord.id;

                // 1) Buscar dados da PO que serão usados como chave (lineReference, trackingNumber, carrier)
                const trackingData = gettrackdata_service.getTrackingData(purchaseOrderId);
                log.debug({
                    title: 'beforeLoad - trackingData',
                    details: trackingData
                });

                if (!trackingData || !trackingData.items || trackingData.items.length === 0) {
                    log.debug('beforeLoad', 'Nenhuma linha com tracking para processar.');
                    return;
                }

                // 2) Montar payload FINAL que será enviado para o módulo de atualização
                const payloadFinal = {
                    idPurchaseOrder: purchaseOrderId,
                    items: []
                };

                // 3) Percorrer cada item retornado pelo serviço
                trackingData.items.forEach(function (item, index) {

                    const lineReference = item.lineReference;
                    const trackingNumber = item.trackingNumerLine;

                    // Código numérico do carrier na 17TRACK
                    const carrierCode = carrier_service.getCarrierCode(item.carrier);

                    log.debug({
                        title: 'beforeLoad - item tracking #' + index,
                        details: {
                            lineReference: lineReference,
                            trackingNumber: trackingNumber,
                            carrierOriginal: item.carrier,
                            carrierCodeConverted: carrierCode
                        }
                    });

                    // ======================= VALIDAÇÕES ============================

                    if (!trackingNumber) {
                        log.debug('beforeLoad - ignorado', 'Sem trackingNumber (lineReference: ' + lineReference + ')');
                        return;
                    }

                    if (!lineReference) {
                        log.debug('beforeLoad - ignorado', 'Sem lineReference (tracking: ' + trackingNumber + ')');
                        return;
                    }

                    if (!carrierCode) {
                        log.debug('beforeLoad - ignorado', 'Sem carrierCode válido para tracking: ' + trackingNumber);
                        return;
                    }

                    // =================================================================

                    // 4) Montar entrada para API 17TRACK
                    const entry = {
                        number: trackingNumber,
                        carrier: carrierCode
                    };

                    log.debug('beforeLoad - getTrackInfo payload enviado', entry);

                    const trackInfoResponse = gettrackinfo_service.getTrackInfo(entry);

                    // 5) Validar retorno da API
                    const acceptedArray = trackInfoResponse &&
                        trackInfoResponse.data &&
                        trackInfoResponse.data.accepted;

                    if (!acceptedArray || !acceptedArray[0]) {
                        log.debug('beforeLoad - retorno inválido da API', trackInfoResponse);
                        return;
                    }

                    const acceptedItem = acceptedArray[0];
                    const trackInfo = acceptedItem.track_info || {};

                    const latestStatus = trackInfo.latest_status;
                    const trackingProvider = trackInfo.tracking &&
                        trackInfo.tracking.providers &&
                        trackInfo.tracking.providers[0];

                    // 🔹 NOVO: métricas de tempo (estimated delivery)
                    const timeMetrics = trackInfo.time_metrics;
                    const estimatedDeliveryTo = timeMetrics &&
                        timeMetrics.estimated_delivery_date &&
                        timeMetrics.estimated_delivery_date.to;

                    if (!latestStatus || !trackingProvider) {
                        log.debug('beforeLoad - retorno incompleto da API', trackInfoResponse);
                        return;
                    }

                    // 6) Extrair dados necessários
                    const status = latestStatus.status;
                    const subStatus = latestStatus.sub_status;
                    const latestSyncTime = trackingProvider.latest_sync_time;

                    // 7) Inserir item no payload final
                    payloadFinal.items.push({
                        lineReference: lineReference,
                        status: status + ' - ' + subStatus,
                        carrier: carrierCode,
                        latestSyncTime: latestSyncTime,
                        // 🔹 SEMPRE presente no payload: se não vier nada da API, fica null
                        estimatedDeliveryDate: (estimatedDeliveryTo === undefined ? null : estimatedDeliveryTo)
                    });

                    log.debug({
                        title: 'beforeLoad - payload item #' + index,
                        details: payloadFinal.items[payloadFinal.items.length - 1]
                    });

                });

                // 8) Se nada válido foi gerado, encerra
                if (!payloadFinal.items || payloadFinal.items.length === 0) {
                    log.debug('beforeLoad', 'Nenhum item válido para atualização da PO.');
                    return;
                }

                // 9) Chamar o SERVICE para atualizar a PO
                const updateResult = update_tracking_service.updatePOTrackingInformation(payloadFinal);

                log.audit('beforeLoad - Atualização da PO via SERVICE', updateResult);

                // ============================
                // ETAPA: Processar notificações
                // ============================

                // 1) Obter parâmetros para criação ou atualização
                var params = track_notification_params_service.getTrackNotificationParams(
                    purchaseOrderId,
                    payloadFinal
                );
                
                log.debug('beforeLoad - params', params);

                if (!params) {
                    log.debug('beforeLoad - Notificações', 'Nenhum parâmetro retornado.');
                    return;
                }

                // 2) Criar registros customrecord_pd_tno_track_notification
                if (params.createItems && params.createItems.length > 0) {

                    var poForCreate = record.load({
                        type: record.Type.PURCHASE_ORDER,
                        id: purchaseOrderId,
                        isDynamic: false
                    });

                    params.createItems.forEach(function (item) {

                        var newId = track_notification_service.createTrackNotification(item);

                        if (newId) {
                            poForCreate.setSublistValue({
                                sublistId: 'item',
                                fieldId: 'custcol_pd_tno_track_notification_id',
                                line: item.line,
                                value: newId
                            });
                        }
                    });

                    poForCreate.save({
                        enableSourcing: false,
                        ignoreMandatoryFields: true
                    });

                    log.audit('beforeLoad - Notificações', 'Registros criados: ' + params.createItems.length);
                }

                // 3) Atualizar registros existentes de customrecord_pd_tno_track_notification
                if (params.updateItems && params.updateItems.length > 0) {

                    var updatePayload = {
                        items: params.updateItems
                    };

                    track_notification_update_service.updateTrackNotifications(updatePayload);

                    log.audit('beforeLoad - Notificações', 'Registros atualizados: ' + params.updateItems.length);
                }



            } catch (error) {
                log.error('beforeLoad - Erro inesperado', error);
            }
        }


        function afterSubmit(context) {
            try {

                if (context.type !== context.UserEventType.CREATE &&
                    context.type !== context.UserEventType.EDIT) {
                    return;
                }

                const poId = context.newRecord.id;

                const trackingData = gettrackdata_service.getTrackingData(poId);
                log.debug('afterSubmit - trackingData', trackingData);

                if (!trackingData || !trackingData.items || trackingData.items.length === 0) {
                    log.debug('afterSubmit', 'Nenhuma linha com tracking para processar.');
                    return;
                }

                const payloadRegister = [];

                trackingData.items.forEach(function (item) {

                    const lineReference = item.lineReference;
                    const trackingNumber = item.trackingNumerLine;
                    const carrierCode = carrier_service.getCarrierCode(item.carrier);

                    if (!trackingNumber || !lineReference || !carrierCode) {
                        return;
                    }

                    payloadRegister.push({
                        number: trackingNumber,
                        carrier: carrierCode
                    });
                });

                if (payloadRegister.length === 0) {
                    log.debug('afterSubmit', 'Nenhum item válido para registro.');
                    return;
                }

                const payloadJSON = JSON.stringify(payloadRegister);

                const responseRegister = https.post({
                    url: API_URL,
                    headers: {
                        'Content-Type': 'application/json',
                        '17token': API_TOKEN
                    },
                    body: payloadJSON
                });

                log.audit('afterSubmit - REGISTER response', {
                    status: responseRegister.code,
                    body: responseRegister.body
                });

                // ============================
                // ETAPA 1 — montar payload para o service novo
                // ============================

                const registerReturnPayload = {
                    idPurchaseOrder: poId,
                    items: []
                };

                if (responseRegister.code === 200) {

                    const parsed = JSON.parse(responseRegister.body);

                    if (parsed && parsed.code === 0) {

                        const acceptedArray = parsed.data?.accepted || [];

                        acceptedArray.forEach(function (acceptedItem) {

                            const trackingNumber = acceptedItem.number;
                            const datetimeNow = new Date().toISOString();

                            const originalItem = trackingData.items.find(function (line) {
                                return line.trackingNumerLine === trackingNumber;
                            });

                            if (!originalItem || !originalItem.lineReference) {
                                return;
                            }

                            registerReturnPayload.items.push({
                                lineReference: originalItem.lineReference,
                                datetime: datetimeNow
                            });
                        });
                    }
                }

                log.debug('afterSubmit - registerReturnPayload', registerReturnPayload);

                // ============================
                // ETAPA 3 — chamar o novo service
                // ============================

                if (registerReturnPayload.items.length > 0) {
                    try {
                        update_register_return_service.updatePORegisterReturn(registerReturnPayload);
                        log.audit('afterSubmit', 'Tracking register info updated successfully.');
                    } catch (err) {
                        log.error('afterSubmit - error calling updatePORegisterReturn', err);
                    }
                }

            } catch (error) {
                log.error('afterSubmit - Erro inesperado', error);
            }
        }





        return {
            afterSubmit: afterSubmit,
            beforeLoad: beforeLoad
        };
    });
