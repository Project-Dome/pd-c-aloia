/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
  * Filipe Carvalho - SuiteCode
 */
define(
    [
        'N/record',
        'N/search',

        '../pd_ccr_service/pd-ccr-invoice.service'
    ],
    function (
        record,
        search,

        invoice_service
    ) {

        function afterSubmit(context) {
            if (context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT &&
                context.type !== context.UserEventType.XEDIT) {
                return;
            }

            var invoice = context.newRecord;
            var amountRemaining = invoice.getValue('amountremaining');
            const invoiceId = invoice.id;

            var _invoiceData = invoice_service.getBy({
                by: 'transactionId',
                transactionId: invoiceId
            })
            log.audit({ title: '_invoiceData', details: _invoiceData });

            const isInValidUSDCommission = parseFloat(_invoiceData.commissionTotal) == parseFloat(0)
            if (isInValidUSDCommission) {
                log.error({
                    title: `invoice de id ${invoiceId}`,
                    details: `Does not contain commission`
                })

                return
            }

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


                // Cria o registro customizado
                var customRec = record.create({
                    type: 'customrecord_pd_ccr_approval_comission'
                });

                customRec.setValue({
                    fieldId: 'custrecord_pd_ccr_transaction',
                    value: invoiceId
                });

                customRec.setValue({
                    fieldId: 'custrecord_pd_ccr_amount_value',
                    value: parseFloat(_invoiceData.commissionTotal)
                });

                var recId = customRec.save();
                log.audit('Commission Record Created', 'Internal ID: ' + recId);


            }
        }

        return {
            afterSubmit: afterSubmit
        };
    }
);
