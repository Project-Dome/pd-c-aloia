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
            buyer: { name: 'custbody_aae_buyer' },
            department: { name: 'department' },
            location: { name: 'location' },
            salesOrder: { name: 'custbody_pd_so_sales_order' },
            status: { name: 'status' },
            subsidiary: { name: 'subsidiary' },
            trandate: { name: 'trandate' },
            memo: { name: 'memo' },
            urgencyOrder: { name: 'custbody_aae_urgency_order', type: 'list' },
            vendor: { name: 'entity' },
        };

        const ITEM_SUBLIST_ID = 'item';

        const ITEM_SUBLIST_FIELDS = {

            linkedOrder: { name: 'linkedorder' }, //^Purchase Requisition
            grossAmt: { name: 'grossamt' },
            item: { name: 'item' },
            partNumberCustomer: { name: 'custcol_pd_partnumbercustomer' },
            lineReference: { name: 'custcol_pd_cso_line_reference' },
            custPoReceipt: { name: 'custcol_aae_cust_po_receipt' },
            buyer: { name: 'custcol_aae_buyer_purchase_order' },
            finalCostPoUn: { name: 'custcol_pd_final_cost_po_un' },
            estimatedCostTot: { name: 'custcol_pd_estimated_cost_tot' },
            idSalesOrder: { name: 'custcol_pd_sales_order_linked' }
        };


        function getVendor(idPurchaseOrder) {

            const _objPurchOrd = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: idPurchaseOrder,
            });

            const _vendorPO = _objPurchOrd.getValue('entity');
            log.debug(`Fornecedor PO: ${_vendorPO}`)

            return _vendorPO;
        }

        function getGrossAmout(idPurchaseOrder) {

            const _objPurchOrd = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: idPurchaseOrder,
            });

            const _grossAmountPO = _objPurchOrd.getValue('grossamt');
            log.debug(`Gross Amount PO: ${_grossAmountPO}`)

            return _grossAmountPO
        }

        function getLinesGrossAmount(idPurchaseOrder) {
            const prMap = {};

            const poRec = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: idPurchaseOrder,
                isDynamic: false
            });

            const lineCount = poRec.getLineCount({ sublistId: 'item' }) || 0;

            for (let i = 0; i < lineCount; i++) {
                const requisitionId = poRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'linkedorder',
                    line: i
                });

                if (!requisitionId) continue;

                const lineKey = poRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'lineuniquekey',
                    line: i
                });

                const grossAmtLine = Number(
                    poRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'grossamt',
                        line: i
                    })
                ) || 0;

                if (!prMap[requisitionId]) prMap[requisitionId] = [];

                prMap[requisitionId].push({ lineKey, grossAmtLine });
            }

            log.debug('getLinesGrossAmount - resultado', prMap);
            return prMap;
        }

        function readData(options) {
            try {

                log.debug({ title: 'Linha 131 - readData - options', details: options })

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

                return _purchaseOrderData;

            } catch (error) {
                log.error({ title: 'Linha 150 - readData - error', details: error });
            }
        }

        function propagateFinalCost(options) {
            try {
                const poRec = options && options.poRec;

                if (!poRec) {
                    log.error({
                        title: 'propagateFinalCost',
                        details: 'Parâmetro poRec não foi fornecido.'
                    });
                    return false;
                }

                const poData = readData(poRec);

                if (!poData || !poData.itemList || !poData.itemList.length) {
                    log.debug({
                        title: 'propagateFinalCost',
                        details: 'Sem itens válidos para processar.'
                    });
                    return false;
                }

                setFinalCostUnitFromPOToPR({ itemList: poData.itemList });
                setFinalCostUnitFromPOToSO({ itemList: poData.itemList });

                log.debug({
                    title: 'propagateFinalCost',
                    details: 'Propagação de custo unitário final concluída.'
                });

                return true;

            } catch (error) {
                log.debug({ title: 'Linha 186 -propagateFinalCost - error', details: error })
            }
        }


        function updateFinalCostPoUnFromRate(idPurchaseOrder) {
            try {
                const _purchOrdRec = record.load({
                    type: record.Type.PURCHASE_ORDER,
                    id: idPurchaseOrder,
                    isDynamic: false
                });

                const lineCount = _purchOrdRec.getLineCount({ sublistId: 'item' });

                for (let i = 0; i < lineCount; i++) {
                    const rate = parseFloat(_purchOrdRec.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'rate',
                        line: i
                    })) || 0;

                    _purchOrdRec.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_pd_final_cost_po_un',
                        line: i,
                        value: rate
                    });
                }

                _purchOrdRec.save({ ignoreMandatoryFields: true });

                return { success: true, idPurchaseOrder: idPurchaseOrder };

            } catch (e) {
                log.error({
                    title: 'Erro ao atualizar custcol_pd_final_cost_po_un com rate',
                    details: e
                });

                return { success: false, error: e, idPurchaseOrder: idPurchaseOrder };
            }
        }

        function purchaseOrderData(idPurchaseOrder) {

            log.debug({ title: 'Linha 233 - purchaseOrderData - idPurchaseOrder', details: idPurchaseOrder });

            const _purchOrderData = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: idPurchaseOrder,
                isDynamic: false
            });

            return _purchOrderData;
        }

        function purchOrderRecords(idPurchaseOrder) {
            const purchOrdArr = [];

            const _purchOrdRec = record.load({
                type: record.Type.PURCHASE_ORDER,
                id: idPurchaseOrder,
                isDynamic: false
            });

            const lineCount = _purchOrdRec.getLineCount({ sublistId: 'item' });

            for (let i = 0; i < lineCount; i++) {

                const _finalCost = _purchOrdRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_pd_final_cost_po_un',
                    line: i
                });

                const _prLinked = _purchOrdRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'linkedorder',
                    line: i
                });

                const _soLinked = _purchOrdRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_pd_sales_order_linked',
                    line: i
                });

                const _lineRef = _purchOrdRec.getSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_pd_cso_line_reference',
                    line: i
                });

                purchOrdArr.push({

                    finalCostPoUn: _finalCost,
                    linkedOrder: _prLinked[0],
                    idSalesOrder: _soLinked,
                    lineReference: _lineRef
                });
            }

            return purchOrdArr;
        }



        return {
            getVendor: getVendor,
            getGrossAmout: getGrossAmout,
            getLinesGrossAmount: getLinesGrossAmount,
            readData: readData,
            propagateFinalCost: propagateFinalCost,
            updateFinalCostPoUnFromRate: updateFinalCostPoUnFromRate,
            purchaseOrderData: purchaseOrderData,
            purchOrderRecords: purchOrderRecords
        }
    });