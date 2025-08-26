/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 *Author: Lucas Monaco 
 */
define(
    [
        'N/runtime',
        'N/search',
        'N/log',
        'N/record',
        'N/url',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-restlet.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        runtime,
        search,
        log,
        record,
        url,
        search_util,
        restlet_util,
        common_util
    ) {

        const TYPE = 'customrecord_pd_ccr_approval_comission';

        const FIELDS = {
            rtId: { name: 'internalid' },
            status: { name: 'custrecord_pd_ccr_status' },
            invoiceId: { name: 'custrecord_pd_ccr_transaction' }
        };

        function executeCommissionReport() {
            var results = [];

            search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.status, 'is', "3")),
                each: function (data) {
                    results.push(data);
                }
            });

            log.audit("Commission Report Results", results);

            return { success: true, data: results };
        }

        function getComissionByInvoiceId(invoiceId) {
            return search_util.all({
                type: TYPE,
                columns: FIELDS,
                query: search_util
                    .where(search_util.query(FIELDS.invoiceId, 'anyof', invoiceId))
            });
        }

        const STATUS_COMISSION = {
            PENDING: 3,
            APPROVED: 1,
            REPROVED: 2
        }

        function updateCommissionStatus(context) {
            log.audit("Update Commission Status Context", context);

            const invoiceIds = context.records || [];
            const isApprov = context.isApprov;

            log.audit("Invoice IDs", invoiceIds);
            const comissionDataList = getComissionByInvoiceId(invoiceIds);
            log.audit("Comission Data List", comissionDataList);

            if (!invoiceIds.length) return { success: false, message: 'Nenhum registro selecionado.' };

            comissionDataList.forEach(comissionData => {
                let commisionRecord = record.load({
                    type: TYPE,
                    id: comissionData.rtId
                });

                commisionRecord.setValue({
                    fieldId: 'custrecord_pd_ccr_status',
                    value: isApprov ? STATUS_COMISSION.APPROVED : STATUS_COMISSION.REPROVED
                });

                commisionRecord.save();
            });

            return { success: true, updated: invoiceIds };
        }

        function getHandler() {
            try {
                return executeCommissionReport();
            } catch (e) {
                log.error("Erro ao executar GET", e);
                return { success: false, message: e.message };
            }
        }

        function postHandler(context) {
            try {
                return updateCommissionStatus(context);
            } catch (e) {
                log.error("Erro ao executar POST", e);
                return { success: false, message: e.message };
            }
        }

        return {
            get: getHandler,
            post: postHandler
        }
    }
);
