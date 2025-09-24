/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Rogério Gonçalves Rodrigues
 */
define(
    [
        'N/log',
        'N/record',
        'N/runtime',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function
        (
            log,
            record,
            runtime,

            search_util,
            record_util
        ) {

        function getVendor(idPurchaseOrder){

            const _objPurchOrd = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: idPurchaseOrder,
            });

            const _vendorPO = _objPurchOrd.getValue('entity');
            log.debug(`Fornecedor: ${_vendorPO}`)

            return _vendorPO;
        }


        return {
            getVendor: getVendor
        }
    });