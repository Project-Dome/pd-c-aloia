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
        const TYPE = 'purchaserequisition';
        const FIELDS = {
            requestor: { name: 'entity' },
            receiveBy: { name: 'duedate' },
            date: { name: 'trandate' },
            memo: { name: 'memo' },
            subsidiary: { name: 'subsidiary' },
            department: { name: 'department' },
            location: { name: 'location' },
            createdFrom: { name: 'createdfrom' },
            salesOrder: { name: 'custbody_pd_so_sales_order' },
            approvalStatus: { name: 'approvalstatus' },
            buyer: { name: 'custbody_aae_buyer' },
            urgencyOrder: { name: 'custbody_aae_urgency_order' },
            calculateTax: { name: 'custbody_ste_use_tax' }
        };

        const ITEM_SUBLIST_ID = 'item';

        const ITEM_SUBLIST_FIELDS = {
            customer: { name: 'customer' },
            estimatedAmount: { name: 'estimatedamount' },
            estimatedRate: { name: 'estimatedrate' },
            item: { name: 'item' },
            line: { name: 'line' },
            linkedOrder: { name: 'linkedorder' },
            poVendor: { name: 'povendor' },
            quantity: { name: 'quantity' },
            rate: { name: 'rate' },
            lineUniqueKey: { name: 'lineuniquekey' },
            units: { name: 'units' }
        };

        const APPROVAL_STATUS = 1;  //TODO: 1 = Pending Approval // 2 = Approved

        function getByStatus(idPurchaseRequisition) {
            try {

                log.debug({ title: 'getByStatus - Id Requisition', details: idPurchaseRequisition });

                const _objRequisition = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: true,
                })

                log.debug(`Requistion Status: ${_objRequisition.getText('status')}  e  internal id: ${_objRequisition.getValue('status')}`);

                return _objRequisition.getValue('status');

            } catch (error) {
                log.error({ title: 'Linha 72 - getByStatus - Erro de processameto ', details: error })
            }
        }

        function getRequisitionData(idPurchaseRequisition) {

            try {
                log.debug({ title: 'Linha 126 - getRequisitionData - Id Requisition', details: idPurchaseRequisition });

                let _requistionData = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: true,
                })

                return _requistionData;

            } catch (error) {
                log.error({ title: 'Linha 90 - getRequisitionData - Erro de processameto ', details: error })
            }
        }

        function readData(options) {
            try {

                let _requisitionId = options.id;
                log.debug({ title: 'Linha 145 - readData - _requisitionId', details: _requisitionId });

                let _requistionData = record_util
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

                log.debug({ title: 'Linha 114 - readData - _requistionData', details: _requistionData });

                return _requistionData;

            } catch (error) {
                log.error({ title: 'Linha 119 - readData - error', details: error });
            }

        }

        function createPurchaseRequisition(options) {
            try {

                log.debug({ title: 'Linha 130 - createPurchaseRequisition - dados SO', details: options });

                // const _userObj = runtime.getCurrentUser();
                const _userId = options.itemList[0].buyerRequisitionPo.id;

                log.debug({ title: 'Linha 135 - Sales Rep id', details: options.salesRep });

                let _purchaseRequisitionData = {};
                let _itemList = [];

                _purchaseRequisitionData[FIELDS.requestor.name] = options.salesRep;
                // _purchaseRequisitionData[FIELDS.receiveBy.name] = '';
                _purchaseRequisitionData[FIELDS.date.name] = options.trandate;
                _purchaseRequisitionData[FIELDS.memo.name] = options.memo;
                _purchaseRequisitionData[FIELDS.subsidiary.name] = options.subsidiary;
                _purchaseRequisitionData[FIELDS.department.name] = options.department;
                _purchaseRequisitionData[FIELDS.location.name] = options.location;
                _purchaseRequisitionData[FIELDS.salesOrder.name] = options.id;
                _purchaseRequisitionData[FIELDS.approvalStatus.name] = APPROVAL_STATUS;

                // // _purchaseRequisitionData[FIELDS.calculateTax.name] = '';
                log.debug({ title: 'Linha 151 - createPurchaseRequisition - Dados de primary information', details: _purchaseRequisitionData });
                log.debug({ title: 'Linha 152 - createPurchaseRequisition - Dados da sublista item', details: options.itemList });

                options.itemList.forEach((item, index) => {

                    log.debug({ title: `índice: ${index}`, details: item });
                    let _itemData = {};

                    _itemData[ITEM_SUBLIST_FIELDS.item.name] = item.item.id;
                    _itemData[ITEM_SUBLIST_FIELDS.estimatedAmount.name] = item.estimatedCostPo;
                    _itemData[ITEM_SUBLIST_FIELDS.estimatedRate.name] = item.lastPurchasePrice;
                    _itemData[ITEM_SUBLIST_FIELDS.rate.name] = item.lastPurchasePrice;
                    _itemData[ITEM_SUBLIST_FIELDS.units.name] = item.units;
                    _itemData[ITEM_SUBLIST_FIELDS.quantity.name] = item.quantity;
                    _itemData[ITEM_SUBLIST_FIELDS.customer.name] = options.customerId;
                    _itemData[ITEM_SUBLIST_FIELDS.poVendor.name] = item.poVendor.id;
                    _itemList.push(_itemData);

                    log.debug({ title: `Linha 169 - createPurchaseRequisition - sublista item`, details: _itemList });
                });

                log.debug({ title: `Linha 172 - createPurchaseRequisition - sublista item`, details: _itemList });

                _purchaseRequisitionData.sublists = {};
                _purchaseRequisitionData.sublists[ITEM_SUBLIST_ID] = _itemList;

                log.debug({ title: 'Linha 177 - createPurchaseRequisition - Dados da requisição de compra', details: _purchaseRequisitionData });

                let _specialRequisitionRecord = record.create({
                    type: TYPE,
                    isDynamic: true
                });

                return record_util
                    .handler(_specialRequisitionRecord)
                    .set(_purchaseRequisitionData)
                    .save({ ignoreMandatoryFields: false })

                // return 'End of createPurchaseRequisition'

            } catch (error) {
                log.error({ title: 'Linha 194 - createPurchaseRequisition - Erro de processamento ', details: error })
            }
        }

        function getLineItem(salesOrderData, requistionData) {

            try {
                const _itemSales = salesOrderData.itemList;
                const _itemRequistion = requistionData.itemList;

                // log.debug({ title: 'getLineItem - Dados de item da SO', details: _itemSales });
                // log.debug({ title: 'getLineItem - Dados de item da PR', details: _itemRequistion });

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
                log.error({ title: 'Linha 221 - getLineItem - Erro de processameto ', details: error })
            }
        }

        function removeLine(idPurchaseRequisition, lines) {

            try {

                log.debug({ title: 'removeLine - Id da PR', details: idPurchaseRequisition })
                log.debug({ title: 'removeLine - Lista de linhas de remoção', details: lines })

                let _requistionData = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: true,
                });

                lines.forEach(line => {
                    log.debug('removeLine', `Linha para ser excluída: ${line} e id da requisição: ${idPurchaseRequisition}`);

                    _requistionData.removeLine({
                        sublistId: 'item',
                        line: line,
                        ignoreRecalc: false
                    });
                });

                _requistionData.save({ ignoreMandatoryFields: true });

                return true;

            } catch (error) {
                log.error({ title: 'Linha 253 - removeLine - Erro de processameto ', details: error })
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
                log.error({ title: 'Linha 275- insertItems - Erro de processameto ', details: error })
            }

        }

        function insertionLine(idPurchaseRequisition, itemsList, idCustomer) {

            try {
                log.debug({ title: 'insertionLine - Id da PR', details: idPurchaseRequisition })
                log.debug({ title: 'insertionLine - Lista de linhas de inserção', details: itemsList })
                log.debug({ title: 'insertionLine - idCustomer', details: idCustomer })

                let _requistionData = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: true,
                });

                itemsList.forEach((item, index) => {
                    log.debug({ title: `insertionLine - linha #${index}.`, details: item })
                    log.debug({ title: `insertionLine - linha #${index}.`, details: `povendor: ${item.poVendor.id} ` })

                    let line = _requistionData.selectNewLine({ sublistId: 'item' });

                    // campo "item" (obrigatório)
                    _requistionData.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        value: item.item.id
                    });

                    // campo "customer" 
                    _requistionData.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'customer',
                        value: idCustomer
                    });

                    // quantidade
                    if (item.quantity) {
                        _requistionData.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'quantity',
                            value: item.quantity
                        });
                    }

                    // units (se houver unidade definida)
                    if (item.units) {
                        _requistionData.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'units',
                            value: item.units
                        });
                    }

                    // poVendor (se houver unidade definida)
                    if (item.poVendor) {
                        _requistionData.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: 'povendor',
                            value: item.poVendor.id
                        });
                    }

                    // rate ou amount (caso queira inserir valor)
                    // if (item.amount) {
                    //     _requistionData.setCurrentSublistValue({
                    //         sublistId: 'item',
                    //         fieldId: 'rate',
                    //         value: item.amount
                    //     });
                    // }

                    // commit da linha
                    _requistionData.commitLine({ sublistId: 'item' });


                });

                let _updatedRequistion = _requistionData.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return _updatedRequistion;

            } catch (error) {
                log.error({ title: 'Linha 363 - insertionLine - Erro de processameto ', details: error })
            }
        }

        function hasDifferences(actualItemSales, oldItemSales) {

            try {

                return actualItemSales.some((actualItem, index) => {
                    let oldItem = oldItemSales[index];

                    if (!oldItem) return true; // se não existir correspondente

                    return (
                        actualItem.item.id !== oldItem.item.id ||
                        actualItem.quantity !== oldItem.quantity ||
                        actualItem.poVendor.id !== oldItem.poVendor.id
                    );
                });
            } catch (error) {
                log.error({ title: 'Linha 383 - hasDifferences - Erro de processameto ', details: error })
            }
        }

        function changedItemsList(actualItemSales, oldItemSales) {

            try {

                return actualItemSales
                    .map((actualItem, index) => {
                        let oldItem = oldItemSales[index];

                        // Comparar campos desejados
                        let _isDifferent =
                            actualItem.item.id !== oldItem.item.id ||
                            actualItem.quantity !== oldItem.quantity ||
                            actualItem.poVendor.id !== oldItem.poVendor.id;

                        if (_isDifferent) {
                            // Retornar o objeto de actualItemSales + índice
                            return { index, ...actualItem };
                        }
                        return null;
                    })
                    .filter(el => el !== null);
            } catch (error) {
                log.error({ title: 'Linha 409 - changedItemsList - Erro de processameto ', details: error })
            }

        }

        function updatedRequistion(idPurchaseRequisition, itemsToUpdate) {
            try {

                // log.debug({ title: 'updatedRequistion - _idPurchaseRequisition', details: idPurchaseRequisition });
                // log.debug({ title: 'updatedRequistion - _itemsToUpdate', details: itemsToUpdate });

                let _requistionObj = record.load({
                    type: TYPE,
                    id: idPurchaseRequisition,
                    isDynamic: false,
                });

                itemsToUpdate.forEach(item => {

                    log.debug(`Índice do array na posição purchase requisition é: ${item.index}.`)
                    _requistionObj.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'item',
                        line: item.index,
                        value: item.item.id
                    });

                    _requistionObj.setSublistValue({
                        sublistId: 'item',
                        fieldId: "quantity",
                        line: item.index,
                        value: item.quantity
                    });

                    _requistionObj.setSublistValue({
                        sublistId: 'item',
                        fieldId: 'povendor',
                        line: item.index,
                        value: item.poVendor.id
                    });

                })

                let _updatedRequistion = _requistionObj.save({
                    enableSourcing: true,
                    ignoreMandatoryFields: true
                });

                return _updatedRequistion;

                // return true;
            } catch (error) {
                log.error({ title: 'Linha 453 - updatedRequistion - Erro de processameto ', details: error })
            }

        }

        return {
            changedItemsList: changedItemsList,
            createPurchaseRequisition: createPurchaseRequisition,
            getByStatus: getByStatus,
            getRequisitionData: getRequisitionData,
            getLineItem: getLineItem,
            hasDifferences: hasDifferences,
            itemsToInsert: itemsToInsert,
            insertionLine: insertionLine,
            readData: readData,
            removeLine: removeLine,
            updatedRequistion: updatedRequistion
        }
    });