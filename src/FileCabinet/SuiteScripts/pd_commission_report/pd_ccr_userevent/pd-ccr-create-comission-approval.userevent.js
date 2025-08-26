/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
  * Filipe Carvalho - SuiteCode
 */
define(['N/record', 'N/search'], function(record, search) {

    function afterSubmit(context) {
        if (context.type !== context.UserEventType.CREATE &&
            context.type !== context.UserEventType.EDIT &&
            context.type !== context.UserEventType.XEDIT) {
            return;
        }

        var invoice = context.newRecord;
        var amountRemaining = invoice.getValue('amountremaining');
        var invoiceId = invoice.id;

        // Só cria se a fatura estiver totalmente paga
        if (amountRemaining === 0) {

            // 🔎 Verificar se já existe um registro vinculado
            var existingSearch = search.create({
                type: 'customrecord_pd_ccr_approval_comission',
                filters: [
                    ['custrecord_pd_ccr_transaction', 'is', invoiceId]
                ],
                columns: ['internalid']
            });

            var exists = existingSearch.run().getRange({ start: 0, end: 1 });

            if (exists && exists.length > 0) {
                log.audit('Commission Record Already Exists', 'Invoice ID: ' + invoiceId);
                return; // Já existe, não cria novamente
            }

            try {
                // Cria o registro customizado
                var customRec = record.create({
                    type: 'customrecord_pd_ccr_approval_comission',
                    isDynamic: true
                });

                customRec.setValue({
                    fieldId: 'custrecord_pd_ccr_transaction',
                    value: invoiceId
                });

                var recId = customRec.save();
                log.audit('Commission Record Created', 'Internal ID: ' + recId);

            } catch (e) {
                log.error('Error creating Commission Record', e);
            }
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
