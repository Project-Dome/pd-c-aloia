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

        sales_order_service,
        purchase_requisition_service,

        search_util,
        record_util

    ) {

        function beforeLoad(context) {

            try {

            } catch (error) {

                log.error({ title: 'beforeLoad - Erro de processameto ', details: error });
            }

        }

        function beforeSubmit(context) {

            try {

            } catch (error) {
                log.error({ title: 'beforeSubmit - Erro de processameto ', details: error });
            }

        }

        function afterSubmit(context) {

            try {
                
            } catch (error) {
                log.error({ title: 'afterSubmit - Erro de processameto ', details: error });
            }

        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }

    })