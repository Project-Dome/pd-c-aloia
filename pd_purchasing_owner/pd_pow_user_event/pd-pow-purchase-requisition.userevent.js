/**
 * @NApiVersion     2.1
 * @NScriptType     UserEventScript
 * @NModuleScope    SameAccount
 * @author          Project Dome - Rogério Gonçalves Rodrigues
 */

define(
    [
        'N/record',
        'N/log',
        'N/ui/message',

        '../pd_pow_service/pd-pow-purchase-requisition.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'

    ],
    function (
        record,
        log,
        message,


        purchase_requisition_service,

        search_util,
        record_util

    ) {

        function afterSubmit(context) {

            try {
                if (context.type !== context.UserEventType.CREATE && context.type !== context.UserEventType.EDIT) {
                    return;
                }

                let _newRecord = context.newRecord;
                let _idPurchaseRequistion = _newRecord.id;

                // Se já tiver buyer na PR, não reatribui
                let _existingBuyer = _newRecord.getValue({ fieldId: 'custbody_aae_buyer' });
                if (_existingBuyer) {
                    log.debug({
                        title: 'Linha 49 - afterSubmit - verificação se há comprador',
                        details: `PR já possui buyer PR: ${_idPurchaseRequistion},  buyer: ${_existingBuyer}`
                    });
                    return;
                }

                // Orquestra o processo central no service
                let _idBuyer = purchase_requisition_service.assignBuyerToPR(_idPurchaseRequistion);

                if (_idBuyer) {
                    log.audit({
                        title: 'Linha 60 - afterSubmit - verificação se há comprador',
                        details: `Buyer atribuído, PR: ${ _idPurchaseRequistion} --> Buyer: ${_idBuyer}`
                    });
                } else {
                    log.debug({
                        title: 'Linha 65 - afterSubmit - verificação se há comprador',
                        details: `Nenhum buyer disponível, PR: ${_idPurchaseRequistion}  permanece sem buyer`
                    });
                }

                //TODO: desbloqueiando o comprador.

            } catch (error) {
                log.error({ title: 'Linha 71 - afterSubmit - Erro de processameto ', details: error });
            }

        }

        return {
            afterSubmit: afterSubmit
        }

    })