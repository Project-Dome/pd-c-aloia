/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Rogério Gonçalves Rodrigues
 */

define([

    'N/record',
    'N/log',
    'N/error',
    'N/runtime',

    '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
    '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',

    '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'

], function (
    record,
    log,
    error,
    runtime,

    search_util,
    record_util

) {
    const TYPE = 'salesorder';
    const FIELDS = {
        customerId: { name: 'entity' },
        department: { name: 'department' },
        location: { name: 'location' },
        subsidiary: { name: 'subsidiary' },
        trandate: { name: 'trandate' },
        status: { name: 'status' },
        orderStatus: { name: 'orderstatus' },
        // purchaseRequisition: { name: 'custbody_pd_so_purchase_requisition', type: 'list' }, //todo: anterior fieldId
        purchaseRequisition: { name: 'custbody_pd_cso_linked_requistion', type: 'list' },
        // createPurchaseRequisition: { name: 'custbody_pd_so_create_purchase_requis' },
        dontCreateRequisition: { name: 'custbody_pd_cso_dont_create_req' },
        salesRep: { name: 'salesrep' },
        memo: { name: 'memo' },
        urgencyOrder: { name: 'custbody_aae_urgency_order', type: 'list' }
    };

    const ITEM_SUBLIST_ID = 'item';

    const ITEM_SUBLIST_FIELDS = {
        id: { name: 'internalid' },
        item: { name: 'item', type: 'list' },
        amount: { name: 'amount' },
        department: { name: 'department' },
        lastPurchasePrice: { name: 'lastpurchaseprice' },
        line: { name: 'line' },
        lineUniqueKey: { name: 'lineuniquekey' },
        location: { name: 'location' },
        promiseDate: { name: 'custcol_atlas_promise_date' },
        poVendor: { name: 'custcol_aae_vendor_purchase_order', type: 'list' },
        purchaseOrderLinked: { name: 'custcol_aae_purchase_order_linked' },
        purchaseRequisition: { name: 'custcol_aae_purchaserequisition', type: 'list' },
        buyerRequisitionPo: { name: 'custcol_aae_buyer_purchase_order', type: 'list' },
        estimatedCostPo: { name: 'custcol_aae_estimated_cost_po' },
        slaPo: { name: 'custcol_aae_sla_purchase_order' },
        purchaseOrder: { name: 'custcol_aae_purchaseorder', type: 'list' },
        quantity: { name: 'quantity' },
        units: { name: 'units' },
        poVendorFinal: { name: 'custcol_pd_pow_purchord_vendor', type: 'list' },
        memoLine: { name: 'custcol_pd_memoline' },
        dontCreateRequisition: { name: 'custcol_pd_cso_dont_create_purchreq' }
    };

    function readData(options) {
        try {

            let _invoiceData = record_util
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

            // log.debug({ title: 'linha 75 - readData - _invoiceData', details: _invoiceData });

            return _invoiceData;

        } catch (error) {
            log.error({ title: 'Linha 80 - readData - error', details: error });
        }
    }

    function updateSalesOrder(options) {

        try {
            // log.debug({ title: 'updateSalesOrder -  options', details: options });
            // log.debug({ title: 'updateSalesOrder - id sales order', details: options.id });

            let _objSalesOrder = record.load({
                type: TYPE,
                id: options.id,
                isDynamic: false,
            });

            options.itemList.forEach((line, index) => {
                // só processa se o campo purchaseOrderLinked vier preenchido
                const _hasPurchaseOrderLinked = !isNullOrEmpty(line.purchaseOrderLinked);

                if (_hasPurchaseOrderLinked) {
                    const _purchaseOrderLinked = line.purchaseOrderLinked;

                    log.debug({ title: 'Índice da linha', details: index });
                    log.debug({ title: 'purchaseOrderLinked recebido', details: _purchaseOrderLinked });

                    // lê o valor atual da coluna custcol_aae_purchaseorder na Sales Order
                    let _currentValue = _objSalesOrder.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_aae_purchaseorder',
                        line: index
                    });

                    const _isEmpty = isNullOrEmpty(_currentValue);

                    log.debug({ title: 'Valor atual em custcol_aae_purchaseorder', details: _currentValue });
                    log.debug({ title: 'Está vazio?', details: _isEmpty });

                    // só grava se ainda estiver vazio
                    if (_isEmpty) {
                        _objSalesOrder.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_aae_purchaseorder',
                            line: index,
                            value: _purchaseOrderLinked
                        });

                        log.debug({
                            title: `Linha ${index} atualizada`,
                            details: `custcol_aae_purchaseorder = ${_purchaseOrderLinked}`
                        });
                    } else {
                        log.debug({
                            title: `Linha ${index} não alterada`,
                            details: `já existe valor em custcol_aae_purchaseorder (${_currentValue})`
                        });
                    }
                }
            });


            _objSalesOrder.save();


            return true;

        } catch (error) {
            log.error({ title: 'Linha 137 - updateSalesOrder - error', details: error });
        }

    }

    function upadtePurchaseRequistion(idSalesOrder, idPurchaseRequisition) {

        try {

            log.debug({
                title: 'upadtePurchaseRequistion - Valores de atualização',
                details: `id da Sales Order: ${idSalesOrder} 
                id da Requisition: ${idPurchaseRequisition}.`
            });

            let _salesOrderObj = record.load({
                type: TYPE,
                id: idSalesOrder,
                isDynamic: true,
            });

            _salesOrderObj.setValue({
                fieldId: 'custbody_pd_cso_linked_requistion',
                value: idPurchaseRequisition
            });
            _salesOrderObj.save();

            return true;

        } catch (error) {
            log.error({ title: 'Linha 149 - upadtePurchaseRequistion - error', details: error });
        }

    }

    // TODO: DESENVOLVENDO ATUALIZAÇÃO DOS ITENS
    function getSalesData(idSalesOrder) {

        try {
            log.debug({ title: ' getSalesData - Id Requisition', details: idSalesOrder });

            let _salesOrderData = record.load({
                type: TYPE,
                id: idSalesOrder,
                isDynamic: true,
            })

            return _salesOrderData;

        } catch (error) {
            log.error({ title: 'Linha 169 - getSalesData - Erro de processameto ', details: error })
        }
    }

    function syncLinkedOrders(purchaseRequisitionData, salesOrderData) {
        try {

            const _linkedOrderMap = purchaseRequisitionData.itemList
                .map((item, index) => ({
                    index,
                    linkedOrder: item.linkedOrder
                }))
                .filter(entry => entry.linkedOrder && entry.linkedOrder.length > 0);

            _linkedOrderMap.forEach(entry => {
                const { index, linkedOrder } = entry;

                if (salesOrderData.itemList[index]) {
                    salesOrderData.itemList[index].purchaseOrderLinked = linkedOrder[0];
                    salesOrderData.itemList[index].purchaseRequisition = {
                        id: purchaseRequisitionData.id
                    };
                }
            });

            log.debug({ title: 'syncLinkedOrders - dados moficados na sales order', details: `id sales order: ${salesOrderData.id} ` });
            log.debug({ title: 'syncLinkedOrders - lista de itens moficada na sales order', details: salesOrderData.itemList });

            return salesOrderData;

        } catch (error) {
            log.error({ title: 'Linha 200 - syncLinkedOrders - Erro de processameto ', details: error })
        }
    }

    // function blockEditing(oldSalesOrderData, newSalesOrderData) {

    //     oldSalesOrderData.itemList.forEach((oldLine, index) => {

    //         const oldPO = oldLine.purchaseOrder && oldLine.purchaseOrder.id;
    //         const lineKey = oldLine.lineUniqueKey;

    //         // só processa se o campo já estava preenchido no registro antigo
    //         if (!isNullOrEmpty(oldPO)) {
    //             // procura linha correspondente no newRecord
    //             const newLine = newSalesOrderData.itemList.find(l => l.lineUniqueKey === lineKey);

    //             if (newLine) {
    //                 const newPO = newLine.purchaseOrder && newLine.purchaseOrder.id;

    //                 // se mudou ou foi apagado → bloqueia
    //                 if (isNullOrEmpty(newPO) || newPO !== oldPO) {
    //                     throw error.create({
    //                         name: 'SO_LINE_EDIT_BLOCKED',
    //                         message: 'A linha ' + (index + 1) + ' já está vinculada a uma Purchase Order e não pode ser alterada. Vínculo original: ' + oldPO,
    //                         notifyOff: false
    //                     });
    //                 }
    //             }
    //         }
    //     });

    //     return true;
    // }

    function validateItems(options) {

        return options.every(item => {
            return item?.poVendor?.id &&
                // item?.buyerRequisitionPo?.id &&
                item?.estimatedCostPo !== undefined && item?.estimatedCostPo !== "" &&
                item?.slaPo !== undefined && item?.slaPo !== "";
        });

    }

    return {
        // blockEditing: blockEditing,
        getSalesData: getSalesData,
        readData: readData,
        syncLinkedOrders: syncLinkedOrders,
        upadtePurchaseRequistion: upadtePurchaseRequistion,
        updateSalesOrder: updateSalesOrder,
        validateItems: validateItems
    }
});