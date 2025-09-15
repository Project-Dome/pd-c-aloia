/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Rogério  Gonçalves Rodrigues
 */

define(
    [
        'N/search',
        'N/record',
        'N/log',

        '../pd_pow_service/pd-pow-purchase-requisition.service',

        '../../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util',
        '../../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util',


    ],
    function (
        search,
        record,
        log,

        purchase_requisition_service,

        search_util,
        record_util,


    ) {

        function getInputData() {

            try {
                // Retorna PRs mainline sem buyer
                return search.create({
                    type: 'purchaserequisition',
                    filters: [
                        ['mainline', 'is', 'T'],
                        'AND', ['custbody_aae_buyer', 'isempty', 'T']
                    ],
                    columns: ['internalid', 'tranid', 'trandate']
                });

            } catch (error) {
                log.error({ title: 'Error in getInputData function', details: error })
            }

        }

        function map(context) {
            try {

                var result = JSON.parse(context.value);
                var prId = result.id || result['internalid'] || result['values'] && result['values']['internalid'];
                if (!prId) {
                    // tentar extrair de outra forma
                    prId = result['internalid'] || null;
                }
                if (!prId) return;

                var assigned = prService.assignBuyerToPR(prId);
                if (assigned) {
                    log.audit('MR assign', 'PR ' + prId + ' -> Buyer ' + assigned);
                } else {
                    log.debug('MR assign - no buyer', 'PR ' + prId);
                }

            } catch (error) {
                log.error({ title: 'Error in map function', details: error })
            }
        }

        function reduce(context) {

            try {


            } catch (error) {
                log.error({ title: 'Error in reduce function', details: error })
            }
        }

        function summarize() {
            try {
                log.audit('MR summarize', 'Complete. Processed: ' + (summary.inputSummary ? summary.inputSummary.totalKeys : 'n/a'));
                if (summary.mapSummary && summary.mapSummary.errors) {
                    var mapErrs = summary.mapSummary.errors;
                    for (var key in mapErrs) {
                        if (mapErrs.hasOwnProperty(key)) {
                            log.error('MR map error', key + ' :: ' + JSON.stringify(mapErrs[key]));
                        }
                    }
                }

            } catch (error) {
                log.error({ title: 'Error summarize function', details: error })
            }
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce,
            summarize: summarize
        }
    })
