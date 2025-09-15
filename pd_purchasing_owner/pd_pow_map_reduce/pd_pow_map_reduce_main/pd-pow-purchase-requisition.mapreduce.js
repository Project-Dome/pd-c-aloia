/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(
    [
        'N/search',
        'N/log',

        '../pd_pow_service/pd-pow-purchase-requisition.service'

    ],
    function (
        search,
        log,

        purchase_requisition_service

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
                log.error({ title: 'Error map getInputData', details: error })
            }

        }

        function map(context) {

            try {

                let _result = JSON.parse(context.value);
                let _idPurchaseRequisition = _result.id || _result['internalid'] || (_result.values && _result.values.internalid);

                if (!_idPurchaseRequisition) {

                    // fallback: tentar extrair string
                    let _parsed = context.value;
                    if (_parsed && _parsed.internalid) _idPurchaseRequisition = _parsed.internalid;
                }
                if (!_idPurchaseRequisition) {

                    return;
                }

                let _assigned = purchase_requisition_service.assignBuyerToPR(_idPurchaseRequisition);

                if (_assigned) {

                    log.debug({
                        title: 'Linha 64 - map  Atribuindo PR ao comprador ',
                        details: `MR assign, PR ${ _idPurchaseRequisition} -> Buyer: ${ _assigned}`
                    });

                } else {

                    log.debug({
                        title: 'Linha 71 - map - Requisição sem comprador',
                        details: `MR assign - no buyer, PR: ${_idPurchaseRequisition}`

                    });
                }

            } catch (error) {
                log.error({ title: 'Error map function', details: error })
            }
        }

        // function reduce(context) {

        //     try {


                // return record_log_integration.reduce(context)

        //     } catch (error) {
        //         log.error({ title: 'Error reduce function', details: error })
        //     }
        // }

        function summarize() {
            try {

                let _total = summary.inputSummary ? summary.inputSummary.totalKeys : 'n/a';

                log.audit({
                    title: 'Linha 100 - summarize - MR summarize, Complete.',
                    details: `Processed: + ${_total}`
                });

                if (summary.mapSummary && summary.mapSummary.errors) {

                    let _mapErrs = summary.mapSummary.errors;

                    for (let key in _mapErrs) {

                        if (Object.prototype.hasOwnProperty.call(_mapErrs, key)) {

                            log.error({
                                title: 'Linha 113 - summarize - MR map error', 
                                details: `${key}  :: ${JSON.stringify( _mapErrs[key])}`
                                });
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
            // reduce: reduce,
            summarize: summarize
        }
    }
)