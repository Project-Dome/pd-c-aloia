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
                        tl.custcol_aae_purchaseorder as purchaseOrderId,
                        transaction.id as invoiceId,
                        vendorBillLine.transaction as vendorBillId,
                        tl.custcol_aae_buyer_purchase_order as buyer,
                        tl.custcol_pd_cso_line_reference as lineReference
                    FROM
                        transaction
                        INNER JOIN transactionline as tl ON tl.transaction = transaction.id
                        AND mainline = 'F'
                        AND taxline = 'F'
                        AND tl.custcol_aae_purchaseorder IS NOT NULL
                        INNER JOIN transactionline as vendorBillLine ON vendorBillLine.createdfrom = tl.custcol_aae_purchaseorder
                        AND vendorBillLine.mainline = 'F'
                        AND vendorBillLine.taxline = 'F'
                        AND vendorBillLine.custcol_pd_cso_line_reference = tl.custcol_pd_cso_line_reference
                        INNER JOIN transaction as vendorbill on vendorbill.id = vendorBillLine.transaction
                        AND vendorbill.recordtype = 'vendorbill'
                        LEFT JOIN customrecord_pd_pos_approval_saving AS aps ON aps.custrecord_pd_pos_pas_transaction = vendorBillLine.transaction  
                        AND aps.custrecord_pd_pos_pas_employee = tl.custcol_aae_buyer_purchase_order
                    WHERE
                        transaction.status = 'CustInvc:B'
                        AND transaction.recordtype = 'invoice'
                        AND aps.id IS NULL
                    GROUP BY
                        tl.custcol_aae_purchaseorder,
                        transaction.id,
                        vendorBillLine.transaction,
                        tl.custcol_aae_buyer_purchase_order,
                        tl.custcol_pd_cso_line_reference`
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
                log.audit({ title: 'Key', details: `${_optionsData.invoiceid}&&${_optionsData.buyer}` });

                // throw "Testing"

                context.write({
                    key: `${_optionsData.invoiceid}&&${_optionsData.buyer}`,
                    value: _optionsData
                });
            } catch (exception) {
                log.error('Exceptions map', exception);
            };
        };

        function reduce(context) {
            try {
                let _totalSaving = 0;
                let _invoiceData = JSON.parse(context.values[0]);

                context.values.forEach(commissionApprovalData => {
                    const _optionsData = JSON.parse(commissionApprovalData);
                    log.audit({ title: 'Data reduce', details: _optionsData });

                    const vendorBillLines = vendor_bill_service.getLinesByTransactionIds(_optionsData.vendorbillid);
                    log.audit({ title: 'vendorBillLines', details: vendorBillLines });

                    _totalSaving += mapSavingTotal(vendorBillLines, _optionsData);
                    log.audit({ title: '_totalSaving for each', details: _totalSaving });
                });

                log.audit({ title: '_totalSaving', details: _totalSaving });

                const approvalCommissionRecord = commission_approval_service.create();
                commission_approval_service.set({
                    record: approvalCommissionRecord,
                    data: {
                        transaction: _invoiceData.vendorbillid,
                        status: status_commission_service.STATUS_COMMISSION.PENDING,
                        amountValue: _totalSaving,
                        buyer: _invoiceData.buyer
                    }
                });
                commission_approval_service.save(approvalCommissionRecord);
            } catch (e) {
                log.error('Exceptions reduce', e);
            }
        }
        function mapSavingTotal(vendorBillLines, invoiceData) {
            const filteredLines = vendorBillLines.filter(({ buyer, lineReference }) =>
                invoiceData.buyer == buyer && invoiceData.linereference == lineReference
            );

            const totalSaving = filteredLines.reduce((sum, { amount }) => {
                return sum + parseFloat(amount || 0);
            }, 0);

            return totalSaving;
        }

        return {
            getInputData: getInputData,
            map: map,
            reduce: reduce
        }
    }
);
