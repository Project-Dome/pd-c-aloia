/**
 * @NApiVersion 2.1
 * @ModuleScope public
 * @author Project Dome - Mário Augusto Braga Costa
 */
define(
    [
        'N/log',
        'N/record',
        'N/runtime',
        'N/cache',
        'N/record',
        'N/format',
        'N/query',


        '../../pd_pos_service/pd-pos-commission-approval.service',
        '../../pd_pos_service/pd-pos-status-commission.service',
        '../../pd_pos_service/pd-pos-vendor-bill.service',
    ],
    function (
        log,
        record,
        runtime,
        cache,
        record,
        format,
        query,

        commission_approval_service,
        status_commission_service,
        vendor_bill_service
    ) {
        function getVendorBillByInvoice() {
            const _queryString = buildQuery();

            const _results = query.runSuiteQL({
                query: _queryString
            }).asMappedResults();

            log.audit({ title: '_results', details: _results });

            return _results.length > 0 ? _results : null;

            function buildQuery() {
                const _queryString = [
                    `SELECT
                        DISTINCT tl.custcol_aae_purchaseorder as purchaseOrderId,
                        transaction.id as invoiceId,
                        vendorBillLine.transaction as vendorBillId
                    FROM
                        transaction
                        INNER JOIN transactionline as tl ON tl.transaction = transaction.id
                        and mainline = 'F'
                        and taxline = 'F'
                        and tl.custcol_aae_purchaseorder IS NOT NULL
                        INNER JOIN transactionline as vendorBillLine ON vendorBillLine.createdfrom = tl.custcol_aae_purchaseorder
                        and vendorBillLine.mainline = 'F'
                        and vendorBillLine.taxline = 'F'
                        INNER JOIN transaction as vendorbill on vendorbill.id = vendorBillLine.transaction and vendorbill.recordtype = 'vendorbill'
                        LEFT JOIN customrecord_pd_pos_approval_saving AS aps ON aps.custrecord_pd_pos_pas_transaction = vendorBillLine.transaction
                    WHERE
                        transaction.status = 'CustInvc:B'
                        and transaction.recordtype = 'invoice'
                        and aps.id IS NULL`
                ].join(' ');

                return _queryString;
            }
        }

        function getInputData() {
            try {
                return getVendorBillByInvoice();
            } catch (error) {
                log.error({ title: 'error', details: error });
            }
        }

        function map(context) {
            try {
                const _optionsData = JSON.parse(context.value);
                log.audit({ title: '_optionsData', details: _optionsData });

                context.write({
                    key: context.key,
                    value: {
                        data: _optionsData
                    }
                });
            } catch (exception) {
                log.error('Exceptions map', exception);
            };
        };

        function reduce(context) {
            try {
                const _optionsData = JSON.parse(context.values[0])?.data;
                const vendorBillLines = vendor_bill_service.getLinesByTransactionIds(_optionsData.vendorbillid);
                const vendorBillSavingTotalMap = mapSavingTotal(vendorBillLines);

                log.audit({
                    title: 'Reduce Data', details: {
                        _optionsData: _optionsData,
                        vendorBillSavingTotalMap: vendorBillSavingTotalMap
                    }
                });

                const approvalCommissionRecord = commission_approval_service.create();

                commission_approval_service.set({
                    record: approvalCommissionRecord,
                    data: {
                        transaction: _optionsData.vendorbillid,
                        status: status_commission_service.STATUS_COMMISSION.PENDING,
                        amountValue: vendorBillSavingTotalMap[_optionsData.vendorbillid].totalSaving
                    }
                });

                commission_approval_service.save(approvalCommissionRecord);
            } catch (e) {
                log.error('Exceptions reduce', e);
            }
        }

        function mapSavingTotal(vendorBillLines) {
            return vendorBillLines.reduce((acc, { id, amount }) => {
                if (!acc[id]) {
                    acc[id] = { totalSaving: 0 };
                }
                acc[id].totalSaving += parseFloat(amount);
                return acc;
            }, {});
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce
        }
    }
);
