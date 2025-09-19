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
        const TYPE = 'purchaseorder';
        const FIELDS = {
            internalId: { name: 'internalid' },
            vendor: { name: 'entity', type: 'list' }


        };

        const ITEM_SUBLIST_ID = 'item';

        const ITEM_SUBLIST_FIELDS = {
            internalid: { name: 'internalid' }

        };

        function readData(options) {
            try {

                let _purchaseOderId = options.id;
                log.debug({ title: 'Linha 105 - readData - _purchaseOderId', details: _purchaseOderId });

                let _purchaseOrderData = record_util
                    .handler(options)
                    .data(
                        {
                            fields: FIELDS,
                            sublists: {
                                itemList: {
                                    name: ITEM_SUBLIST_ID,
                                    fields: ITEM_SUBLIST_FIELDS,
                                }
                            }
                        }
                    );

                log.debug({ title: 'Linha 53 - readData - _purchaseOrderData', details: _purchaseOrderData });

                return _purchaseOrderData;

            } catch (error) {
                log.error({ title: 'Linha 58 - readData - error', details: error });
            }

        }

        return {
            readData: readData
        }
    });