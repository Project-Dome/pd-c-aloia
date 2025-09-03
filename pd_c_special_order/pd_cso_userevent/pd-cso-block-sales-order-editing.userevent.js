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
        'N/error',
        'N/runtime',

        '../pd_cso_service/pd-cso-sales-order.service',
        '../pd_cso_service/pd-cso-purchase-requisition.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',


        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'

    ],
    function (
        record,
        log,
        message,
        error,
        runtime,

        sales_order_service,
        purchase_requisition_service,

        search_util,
        record_util

    ) {

        function beforeSubmit(context) {

            if (runtime.getCurrentUser().role === 3) return; // Administrador pode tudo

            if (context.type !== context.UserEventType.EDIT) return;

            var oldRec = context.oldRecord;
            var newRec = context.newRecord;

            var lineCount = oldRec.getLineCount({ sublistId: 'item' });

            // TODO: PERCCORE A LISTA ITEM

            for (var i = 0; i < lineCount; i++) {
                var oldPO = oldRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_aae_purchaseorder',
                    line: i
                });
                if (oldPO) {
                    var oldKey = oldRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'lineuniquekey',
                        line: i
                    });

                    var newIndex = findLineByKey(newRec, oldKey);

                    if (newIndex >= 0) {

                        var fieldsToCheck = ['item', 'quantity', 'rate', 'amount', 'description', 'location'];

                        for (var f = 0; f < fieldsToCheck.length; f++) {

                            var field = fieldsToCheck[f];

                            var oldVal = oldRec.getSublistValue({ sublistId: 'item', fieldId: field, line: i });
                            var newVal = newRec.getSublistValue({ sublistId: 'item', fieldId: field, line: newIndex });

                            if (oldVal !== newVal) {
                                throw error.create({
                                    name: 'ERR_SO_LINE_LOCK',
                                    message: 'A linha vinculada à Purchase Order não pode ser alterada (linha ' + (i + 1) + ').',
                                    notifyOff: false
                                });
                            }
                        }
                    }
                }
            }
        }

        function findLineByKey(rec, key) {

            var count = rec.getLineCount({ sublistId: 'item' });
            
            for (var j = 0; j < count; j++) {

                var lineKey = rec.getSublistValue({ sublistId: 'item', fieldId: 'lineuniquekey', line: j });

                if (lineKey === key) return j;
            }

            return -1;
        }

        return {
            beforeSubmit: beforeSubmit
        }
    })