/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(
    [
        '../pd_cvi_map_reduce_service/pd-cvi-vtex-sales-order-integration.service'
    ],
    function (
        record_log_integration
    ) {

        function getInputData() {
            // return record_log_integration.getInputData()
        }

        function map(context) {

            try {

                return record_log_integration.map(context)

            } catch (error) {
                log.error({ title: 'Error map function', details: error })
            }
        }

        function reduce(context) {

            try {

                return record_log_integration.reduce(context)

            } catch (error) {
                log.error({ title: 'Error reduce function', details: error })
            }
        }

        function summarize() {
            try {


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
    }
)