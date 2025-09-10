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

    function (
        log,
        record,
        runtime,

        search_util,
        record_util
    ) {

        const TYPE = 'purchaserequisition';

        const FIELDS = {
            internalId: { name: 'internalid'},
            approvalStatus: { name: 'approvalstatus' },
            buyer: { name: 'custbody_aae_buyer' },
            requestor: { name: 'entity' },
            status: { name: 'status' },
            urgencyOrder: { name: 'custbody_aae_urgency_order' },
        };

        function readData(options) {
            try {

                let _requisitionId = options.id;
                log.debug({ title: 'Linha 42 - readData - _requisitionId', details: _requisitionId });

                let _requistionData = record_util
                    .handler(options)
                    .data(
                        {
                            fields: FIELDS,
                            // sublists: {
                            //     itemList: {
                            //         name: ITEM_SUBLIST_ID,
                            //         fields: ITEM_SUBLIST_FIELDS,
                            //     }
                            // }
                        }
                    );

                log.debug({ title: 'Linha 58 - readData - _requistionData', details: _requistionData });

                return _requistionData;

            } catch (error) {
                log.error({ title: 'Linha 63 - readData - error', details: error });
            }

        }



        return {
            readData: readData
        }
    })