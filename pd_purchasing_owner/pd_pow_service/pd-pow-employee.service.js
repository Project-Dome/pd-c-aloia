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

        const TYPE = 'employee';

        const FIELDS = {

            internalid: { name: 'internalid' },
            onLeave: { name: 'custentity_pd_pow_aae_onleave' },
            shiftStart: { name: 'custentity_pd_pow_shift_start' },
            shiftEnd: { name: 'custentity_pd_pow_shift_end' },
            requisitionAssignedToday: { name: 'custentity_pd_pow_prs_assigned_today' },
            buyer: { name: 'custentity_pd_pow_buyer' },
            isInactive: { name: 'isinactive' }
        }

        function readData(options) {
            try {

                let _employeeId = options.id;
                log.debug({ title: 'Linha 45 - readData - _requisitionId', details: _employeeId });

                let _employeeData = record_util
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

                log.debug({ title: 'Linha 58 - readData - _requistionData', details: _employeeData });

                return _employeeData;

            } catch (error) {
                log.error({ title: 'Linha 63 - readData - error', details: error });
            }

        }


        return {
            readData: readData
        }
    })