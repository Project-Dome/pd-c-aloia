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

        '../pd_cso_service/pd-cso-purchase-order.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        log,
        record,
        runtime,

        purchase_order_service,

        search_util,
        record_util
    ) {
        const TYPE = 'purchaserequisition';
        const SALES_ORDER_TYPE = 'salesorder';

        const FIELDS = {
            requestor:     { name: 'entity' },
            receiveBy:     { name: 'duedate' }, // PR recebe do SO.custbody_aae_cust_po_receipt
            date:          { name: 'trandate' },
            memo:          { name: 'memo' },
            subsidiary:    { name: 'subsidiary' },
            department:    { name: 'department' },
            location:      { name: 'location' },
            createdFrom:   { name: 'createdfrom' },
            salesOrder:    { name: 'custbody_pd_so_sales_order' },
            approvalStatus:{ name: 'approvalstatus' },
            buyer:         { name: 'custbody_aae_buyer' },
            urgencyOrder:  { name: 'custbody_aae_urgency_order' }, // só setar se houver valor
            calculateTax:  { name: 'custbody_ste_use_tax' }
        };

        const ITEM_SUBLIST_ID = 'item';

        const ITEM_SUBLIST_FIELDS = {
            customer:            { name: 'customer' },
            estimatedAmount:     { name: 'estimatedamount' },
            estimatedRate:       { name: 'estimatedrate' },
            item:                { name: 'item' },
            line:                { name: 'line' },
            linkedOrder:         { name: 'linkedorder' },
            poVendor:            { name: 'custcol_aae_vendor_purchase_order' },
            quantity:            { name: 'quantity' },
            rate:                { name: 'rate' },
            lineUniqueKey:       { name: 'lineuniquekey' },
            units:               { name: 'units' },
            poVendorFinal:       { name: 'custcol_pd_pow_purchord_vendor', type: 'list' },
            memoLine:            { name: 'custcol_pd_memoline' },
            partNumberCustomer:  { name: 'custcol_pd_partnumbercustomer' },
            estimatedCostPo:     { name: 'custcol_aae_estimated_cost_po' },
            slaPurchaseOrder:    { name: 'custcol_aae_sla_purchase_order' }, // (linha → linha)
            promiseDate:         { name: 'custcol_atlas_promise_date' }      // (linha → linha)
        };

        const SO_BODY_FIELDS = {
            custPoReceipt: 'custbody_aae_cust_po_receipt' // (corpo SO → duedate PR)
        };

        const APPROVAL_STATUS = 1;  // 1 = Pending Approval // 2 = Approved

        // ---------- helpers ----------
        function num(val, fallback) {
            if (val === '' || val === null || val === undefined) return Number(fallback || 0);
            var n = Number(val);
            return isNaN(n) ? Number(fallback || 0) : n;
        }

        function getLineFieldFromSalesOrderLine(salesOrderId, lineUniqueKey, fieldId) {
            try {
                if (!salesOrderId || !lineUniqueKey || !fieldId) return null;

                var so = record.load({
                    type: SALES_ORDER_TYPE,
                    id: salesOrderId,
                    isDynamic: false
                });

                var line = so.findSublistLineWithValue({
                    sublistId: 'item',
                    fieldId: 'lineuniquekey',
                    value: String(lineUniqueKey)
                });

                if (line === -1) return null;

                return so.getSublistValue({
                    sublistId: 'item',
                    fieldId: fieldId,
                    line: line
                });

            } catch (e) {
                log.error({ title: 'getLineFieldFromSalesOrderLine - erro', details: { salesOrderId, lineUniqueKey, fieldId, e } });
                return null;
            }
        }

        function getSlaFromSalesOrderLine(salesOrderId, lineUniqueKey) {
            return getLineFieldFromSalesOrderLine(salesOrderId, lineUniqueKey, ITEM_SUBLIST_FIELDS.slaPurchaseOrder.name);
        }
        function getPromiseFromSalesOrderLine(salesOrderId, lineUniqueKey) {
            return getLineFieldFromSalesOrderLine(salesOrderId, lineUniqueKey, ITEM_SUBLIST_FIELDS.promiseDate.name);
        }

        function getSoBodyField(salesOrderId, fieldId) {
            try {
                if (!salesOrderId || !fieldId) return null;
                var so = record.load({
                    type: SALES_ORDER_TYPE,
                    id: salesOrderId,
                    isDynamic: false
                });
                return so.getValue({ fieldId: fieldId });
            } catch (e) {
                log.error({ title: 'getSoBodyField - erro', details: { salesOrderId, fieldId, e } });
                return null;
            }
        }

        // ---------- API ----------
        function getByStatus(idPurchaseRequisition) {
            try {
                const _objRequisition = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: true,
                });
                return _objRequisition.getValue('status');
            } catch (error) {
                log.error({ title: 'getByStatus - erro', details: error });
            }
        }

        function getRequisitionData(idPurchaseRequisition) {
            try {
                return record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: true,
                });
            } catch (error) {
                log.error({ title: 'getRequisitionData - erro', details: error });
            }
        }

        function readData(options) {
            try {
                return record_util
                    .handler(options)
                    .data({
                        fields: FIELDS,
                        sublists: {
                            itemList: {
                                name: ITEM_SUBLIST_ID,
                                fields: ITEM_SUBLIST_FIELDS,
                            }
                        }
                    });
            } catch (error) {
                log.error({ title: 'readData - erro', details: error });
            }
        }

        function createPurchaseRequisition(options) {
            try {
                // ====== monta dados para o set em lote ======
                let _purchaseRequisitionData = {};
                let _itemListForCreate = [];
                let _rateFixList = []; // para o pós-ajuste (mesma ordem das linhas criadas)

                // ----- body -----
                _purchaseRequisitionData[FIELDS.requestor.name]      = options.salesRep;
                _purchaseRequisitionData[FIELDS.date.name]           = options.trandate;
                _purchaseRequisitionData[FIELDS.memo.name]           = options.memo;
                _purchaseRequisitionData[FIELDS.subsidiary.name]     = options.subsidiary;
                _purchaseRequisitionData[FIELDS.department.name]     = options.department;
                _purchaseRequisitionData[FIELDS.location.name]       = options.location;
                _purchaseRequisitionData[FIELDS.salesOrder.name]     = options.id;
                _purchaseRequisitionData[FIELDS.approvalStatus.name] = APPROVAL_STATUS;

                // urgência: só setar se houver valor (evita INVALID_FLD_VALUE null)
                if (options.urgencyOrder !== null && options.urgencyOrder !== undefined && options.urgencyOrder !== '') {
                    _purchaseRequisitionData[FIELDS.urgencyOrder.name] = options.urgencyOrder;
                }

                // due date da PR <= SO.custbody_aae_cust_po_receipt
                var custPoReceipt = getSoBodyField(options.id, SO_BODY_FIELDS.custPoReceipt);
                if (custPoReceipt != null && custPoReceipt !== '') {
                    _purchaseRequisitionData[FIELDS.receiveBy.name] = custPoReceipt;
                }

                // ----- linhas -----
                (options.itemList || []).forEach((item) => {
                    if (item.dontCreateRequisition === true) return;

                    const estCost = num(item.estimatedCostPo, 0);
                    const rateVal = num(item.lastPurchasePrice, estCost); // fallback
                    const estRate = num(item.estimatedCostPo, 0);

                    let _itemData = {};
                    _itemData[ITEM_SUBLIST_FIELDS.item.name]               = item.item.id;
                    _itemData[ITEM_SUBLIST_FIELDS.estimatedCostPo.name]    = estCost;
                    _itemData[ITEM_SUBLIST_FIELDS.estimatedRate.name]      = estRate;          // pode ser sobrescrito pelo sourcing
                    _itemData[ITEM_SUBLIST_FIELDS.rate.name]               = rateVal;          // pode ser sobrescrito pelo sourcing
                    _itemData[ITEM_SUBLIST_FIELDS.units.name]              = item.units;
                    _itemData[ITEM_SUBLIST_FIELDS.memoLine.name]           = item.memoLine;
                    _itemData[ITEM_SUBLIST_FIELDS.partNumberCustomer.name] = item.partNumberCustomer;
                    _itemData[ITEM_SUBLIST_FIELDS.quantity.name]           = item.quantity;
                    _itemData[ITEM_SUBLIST_FIELDS.customer.name]           = options.customerId;
                    _itemData[ITEM_SUBLIST_FIELDS.poVendor.name]           = item.poVendor.id;

                    // SLA / Promise (linha → linha)
                    var luk = item.lineUniqueKey || item.lineuniquekey || item[ITEM_SUBLIST_FIELDS.lineUniqueKey.name];

                    var sla = item.slaPurchaseOrder;
                    if (sla == null || sla === '') sla = getSlaFromSalesOrderLine(options.id, luk);
                    if (sla != null && sla !== '') _itemData[ITEM_SUBLIST_FIELDS.slaPurchaseOrder.name] = sla;

                    var promise = item.promiseDate || item[ITEM_SUBLIST_FIELDS.promiseDate.name];
                    if (promise == null || promise === '') promise = getPromiseFromSalesOrderLine(options.id, luk);
                    if (promise != null && promise !== '') _itemData[ITEM_SUBLIST_FIELDS.promiseDate.name] = promise;

                    _itemListForCreate.push(_itemData);

                    // guarda os valores desejados para o pós-ajuste
                    _rateFixList.push({
                        estimatedRate: estRate,
                        rate: rateVal
                    });
                });

                _purchaseRequisitionData.sublists = {};
                _purchaseRequisitionData.sublists[ITEM_SUBLIST_ID] = _itemListForCreate;

                // ====== cria via record_util (como antes) ======
                let _specialRequisitionRecord = record.create({ type: TYPE, isDynamic: true });

                const prId = record_util
                    .handler(_specialRequisitionRecord)
                    .set(_purchaseRequisitionData)
                    .save({ ignoreMandatoryFields: false });

                log.audit({ title: 'PR criada (fase 1)', details: prId });

                // ====== pós-ajuste: reforça estimatedrate/rate por último ======
                try {
                    let prDyn = record.load({ type: TYPE, id: prId, isDynamic: true });
                    const lineCount = prDyn.getLineCount({ sublistId: 'item' }) || 0;

                    for (let i = 0; i < lineCount; i++) {
                        const fix = _rateFixList[i];
                        if (!fix) continue; // segurança

                        prDyn.selectLine({ sublistId: 'item', line: i });

                        prDyn.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: ITEM_SUBLIST_FIELDS.estimatedRate.name,
                            value: fix.estimatedRate,
                            ignoreFieldChange: true
                        });

                        prDyn.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: ITEM_SUBLIST_FIELDS.rate.name,
                            value: fix.rate,
                            ignoreFieldChange: true
                        });

                        // snapshot
                        log.debug({
                            title: `rate patch - linha ${i}`,
                            details: {
                                estimatedRate_set: prDyn.getCurrentSublistValue({ sublistId: 'item', fieldId: ITEM_SUBLIST_FIELDS.estimatedRate.name }),
                                rate_set:          prDyn.getCurrentSublistValue({ sublistId: 'item', fieldId: ITEM_SUBLIST_FIELDS.rate.name })
                            }
                        });

                        prDyn.commitLine({ sublistId: 'item' });
                    }

                    const prId2 = prDyn.save({ enableSourcing: true, ignoreMandatoryFields: true });
                    log.audit({ title: 'PR salva (fase 2, rate fix)', details: prId2 });
                } catch (patchErr) {
                    log.error({ title: 'rate patch - erro ao reforçar estimatedrate/rate', details: patchErr });
                }

                return prId;

            } catch (error) {
                log.error({ title: 'createPurchaseRequisition - erro', details: error });
            }
        }

        function getLineItem(salesOrderData, requistionData) {
            try {
                const _itemSales = salesOrderData.itemList;
                const _itemRequistion = requistionData.itemList;

                let _diffIndexes = _itemRequistion
                    .map((reqItem, index) => {
                        const exists = _itemSales.some(salesItem =>
                            reqItem.item === salesItem.item.id &&
                            reqItem.quantity === salesItem.quantity &&
                            reqItem.poVendor === salesItem.poVendor.id
                        );
                        return exists ? null : index;
                    })
                    .filter(index => index !== null);

                return _diffIndexes;

            } catch (error) {
                log.error({ title: 'getLineItem - erro', details: error });
            }
        }

        function removeLine(idPurchaseRequisition, lines) {
            try {
                let _requistionData = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: true,
                });

                lines.forEach(line => {
                    _requistionData.removeLine({
                        sublistId: 'item',
                        line: line,
                        ignoreRecalc: false
                    });
                });

                _requistionData.save({ ignoreMandatoryFields: true });

                return true;

            } catch (error) {
                log.error({ title: 'removeLine - erro', details: error });
            }
        }

        function itemsToInsert(salesOrderData, requistionData) {
            try {
                const _itemSales = salesOrderData.itemList;
                const _itemRequistion = requistionData.itemList;

                let _itemsToInsert = _itemSales.filter(salesItem =>
                    !_itemRequistion.some(reqItem =>
                        reqItem.item === salesItem.item.id &&
                        reqItem.quantity === salesItem.quantity &&
                        reqItem.poVendor === salesItem.poVendor.id
                    )
                );

                return _itemsToInsert;

            } catch (error) {
                log.error({ title: 'itemsToInsert - erro', details: error });
            }
        }

        function insertionLine(idPurchaseRequisition, itemsList, idCustomer) {
            try {
                let _requistionData = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: true,
                });

                // SO vinculada (para fallback de SLA/Promise)
                var soIdFromPR = _requistionData.getValue({ fieldId: FIELDS.salesOrder.name });

                (itemsList || []).forEach((item, index) => {
                    _requistionData.selectNewLine({ sublistId: 'item' });

                    _requistionData.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: item.item.id
                    });

                    _requistionData.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'customer',
                        value: idCustomer
                    });

                    if (item.quantity) {
                        _requistionData.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: item.quantity
                        });
                    }

                    if (item.units) {
                        _requistionData.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            value: item.units
                        });
                    }

                    if (item.poVendor) {
                        _requistionData.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'povendor',
                            value: item.poVendor.id
                        });
                    }

                    // SLA
                    var luk = item.lineUniqueKey || item.lineuniquekey || item[ITEM_SUBLIST_FIELDS.lineUniqueKey.name];
                    var sla = item.slaPurchaseOrder;
                    if ((sla == null || sla === '') && soIdFromPR) {
                        sla = getSlaFromSalesOrderLine(soIdFromPR, luk);
                    }
                    if (sla != null && sla !== '') {
                        _requistionData.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: ITEM_SUBLIST_FIELDS.slaPurchaseOrder.name,
                            value: sla
                        });
                    }

                    // Promise
                    var promise = item.promiseDate || item[ITEM_SUBLIST_FIELDS.promiseDate.name];
                    if ((promise == null || promise === '') && soIdFromPR) {
                        promise = getPromiseFromSalesOrderLine(soIdFromPR, luk);
                    }
                    if (promise != null && promise !== '') {
                        _requistionData.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: ITEM_SUBLIST_FIELDS.promiseDate.name,
                            value: promise
                        });
                    }

                    _requistionData.commitLine({ sublistId: 'item' });
                });

                let _updatedRequistion = _requistionData.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return _updatedRequistion;

            } catch (error) {
                log.error({ title: 'insertionLine - erro', details: error });
            }
        }

        function hasDifferences(actualItemSales, oldItemSales) {
            try {
                return actualItemSales.some((actualItem, index) => {
                    let oldItem = oldItemSales[index];
                    if (!oldItem) return true;
                    return (
                        actualItem.item.id !== oldItem.item.id ||
                        actualItem.quantity !== oldItem.quantity ||
                        actualItem.poVendor.id !== oldItem.poVendor.id
                    );
                });
            } catch (error) {
                log.error({ title: 'hasDifferences - erro', details: error });
            }
        }

        function changedItemsList(actualItemSales, oldItemSales) {
            try {
                return actualItemSales
                    .map((actualItem, index) => {
                        let oldItem = oldItemSales[index];
                        let _isDifferent =
                            actualItem.item.id !== oldItem.item.id ||
                            actualItem.quantity !== oldItem.quantity ||
                            actualItem.poVendor.id !== oldItem.poVendor.id;

                        if (_isDifferent) {
                            return { index, ...actualItem };
                        }
                        return null;
                    })
                    .filter(el => el !== null);
            } catch (error) {
                log.error({ title: 'changedItemsList - erro', details: error });
            }
        }

        function updatedRequistion(idPurchaseRequisition, itemsToUpdate) {
            try {
                let _requistionObj = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: false,
                });

                itemsToUpdate.forEach(item => {
                    _requistionObj.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: item.index,
                        value: item.item.id
                    });

                    _requistionObj.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'quantity',
                        line: item.index,
                        value: item.quantity
                    });

                    _requistionObj.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'povendor',
                        line: item.index,
                        value: item.poVendor.id
                    });
                });

                let _updatedRequistion = _requistionObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return _updatedRequistion;

            } catch (error) {
                log.error({ title: 'updatedRequistion - erro', details: error });
            }
        }

        function updateVendor(options) {
            let _objPurchReq = record.load({
                type: TYPE,
                id: options.id,
                isDynamic: false,
            });

            options.itemList.forEach((item, index) => {
                const _hasPurchaseOrderLinked = !(item.linkedOrder === '' || item.linkedOrder === null || item.linkedOrder === undefined);
                if (_hasPurchaseOrderLinked) {
                    const _idVendor = purchase_order_service.getVendor(item.linkedOrder);
                    _objPurchReq.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_pd_pow_purchord_vendor',
                        line: index,
                        value: _idVendor
                    });
                }
            });

            _objPurchReq.save();
            return `Purchase Requisition #${options.id} foi atualizada.`;
        }

        return {
            changedItemsList: changedItemsList,
            createPurchaseRequisition: createPurchaseRequisition, // ← com proteção de urgência + pós-ajuste de rate
            getByStatus: getByStatus,
            getRequisitionData: getRequisitionData,
            getLineItem: getLineItem,
            hasDifferences: hasDifferences,
            itemsToInsert: itemsToInsert,
            insertionLine: insertionLine,
            readData: readData,
            removeLine: removeLine,
            updatedRequistion: updatedRequistion,
            updateVendor: updateVendor
        };
    });
