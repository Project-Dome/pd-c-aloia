/**
 * @NApiVersion     2.1
 * @NScriptType     UserEventScript
 * @NModuleScope    SameAccount
 * @author          Project Dome - Rogério Gonçalves Rodrigues
 */

define(
    [
        'N/record',
        'N/log',
        'N/ui/message',
        'N/error',
        'N/runtime',

        '../pd_cso_service/pd-cso-sales-order.service',
        '../pd_cso_service/pd-cso-purchase-requisition.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'

    ],
    function (
        record,
        log,
        message,
        error,
        runtime,

        sales_order_service,
        purchase_requisition_service,

        search_util,
        record_util

    ) {

        function beforeLoad(context) {
            try {

                if (context.type !== context.UserEventType.EDIT) {
                    log.debug('Processo não será executado.');
                    return;
                }

                const _contextType = context.type
                const _cRecord = context.newRecord;
                const _salesOrderData = sales_order_service.readData(_cRecord);
                const _idPurchaseRequisition = _salesOrderData.purchaseRequisition.id;
                const _hasPurchaseRequisition = !isNullOrEmpty(_idPurchaseRequisition);

                log.debug({ title: `beforeLoad - Dados da sales order`, details: _salesOrderData });
                log.debug({ title: 'beforeLoad - _idPurchaseRequisition', details: _idPurchaseRequisition });
                log.debug({ title: 'beforeLoad - _hasPurchaseRequisition', details: _hasPurchaseRequisition });

                // TODO: NÃO HÁ REQUISIÇÃO CRIADA - INTERROMPE PROCESSO
                if (!_hasPurchaseRequisition) {
                    return;
                }

                const _statusPurchaseRequisition = purchase_requisition_service.getByStatus(_idPurchaseRequisition);

                // TODO: VALIDANDO O STATUS DO REGISTRO PURCHASE REQUISITION
                if (_statusPurchaseRequisition === 'Fully Ordered') {
                    const _purchaseRequisition = _cRecord.getText({ fieldId: 'custbody_pd_cso_linked_requistion' });

                    context.form.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: 'Purchase Requisition',
                        message: `The ${_purchaseRequisition} has now been fully met! 
                        New items will not be added to the purchase requisition.`
                    });
                }

                if (_statusPurchaseRequisition === 'Rejected') {
                    const _purchaseRequisition = _cRecord.getText({ fieldId: 'custbody_pd_cso_linked_requistion' });
                    context.form.addPageInitMessage({
                        type: message.Type.ERROR,
                        title: 'Purchase Requisition',
                        message: `The ${_purchaseRequisition} is Rejected!`
                    });
                }

            } catch (error) {
                log.error({ title: 'beforeLoad - Erro de processamento ', details: error });

            }

        }

        function beforeSubmit(context) {
            try {
                let _contextType = context.type;
                if ((_contextType !== context.UserEventType.CREATE) && (_contextType !== context.UserEventType.EDIT) && (_contextType !== context.UserEventType.COPY)) {
                    return;
                }

                let _cRecord = context.newRecord;
                let _numLines = _cRecord.getLineCount({ sublistId: 'item' }) || 0;

                if (_numLines === 0) {
                    return;
                }

                for (let i = 0; i < _numLines; i++) {
                    let _currentValue = _cRecord.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'custcol_pd_cso_line_reference',
                        line: i
                    });

                    // Criação: apenas se estiver vazio
                    if ((_contextType === context.UserEventType.CREATE ||
                        _contextType === context.UserEventType.EDIT) &&
                        !_currentValue) {

                        let _uuid = sales_order_service.generateUUID();
                        _cRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_pd_cso_line_reference',
                            line: i,
                            value: _uuid
                        });
                    }

                    // Cópia: sempre substitui para evitar duplicidade
                    if (_contextType === context.UserEventType.COPY) {

                        let _uuid = sales_order_service.generateUUID();

                        _cRecord.setSublistValue({
                            sublistId: 'item',
                            fieldId: 'custcol_pd_cso_line_reference',
                            line: i,
                            value: _uuid
                        });
                    }
                }

            } catch (error) {
                log.error({ title: 'beforeSubmit - erro ao gerar UUID', details: error });
            }
        }


        function afterSubmit(context) {
            try {
                const _contextType = context.type;

                if ((_contextType !== context.UserEventType.CREATE) && (_contextType !== context.UserEventType.EDIT)) {
                    log.debug('Processo não será executado.');
                    return;
                }

                let _cRecord = context.newRecord;
                const _salesOrderData = sales_order_service.readData(_cRecord);

                log.debug({ title: `afterSubmit - Dados da sales order`, details: _salesOrderData });

                let _purchaseRequisition = _cRecord.getValue({ fieldId: 'custbody_pd_cso_linked_requistion' });
                let _dontCreateRequisition = _cRecord.getValue({ fieldId: 'custbody_pd_cso_dont_create_req' });

                const _validateItems = sales_order_service.validateItems(_salesOrderData.itemList);
                log.debug({ title: 'afterSubmit - _validateItems', details: _validateItems });

                // ============================================================
                //^ CREATE (mantido como está)
                // ============================================================
                if (_contextType == context.UserEventType.CREATE) {
                    if (_validateItems && (_dontCreateRequisition === false)) {
                        _cRecord = record.load({
                            type: _cRecord.type,
                            id: _cRecord.id,
                            isDynamic: false
                        });

                        const _salesOrderReload = sales_order_service.readData(_cRecord);
                        const _idSalesOrder = _salesOrderReload.id;
                        const _createPurchaseRequisition = purchase_requisition_service.createPurchaseRequisition(_salesOrderReload);
                        let _updateSalesOrder = sales_order_service.upadtePurchaseRequistion(_idSalesOrder, _createPurchaseRequisition);

                        log.debug(`Linha 131 - afterSubmit - id da sales order: ${_idSalesOrder}.`);
                        log.debug({ title: 'Linha 132 - afterSubmit - retorno de script requisição', details: _createPurchaseRequisition });
                        log.debug({ title: 'Linha 133 - afterSubmit - retorno de atualização S.O.', details: `Sales Order foi atualizada: ${_updateSalesOrder}` });
                    }
                }

                // ============================================================
                //^ EDIT (mantido + nova sincronização)
                // ============================================================
                if (_contextType == context.UserEventType.EDIT) {
                    if (_validateItems && (_dontCreateRequisition === false) && (_purchaseRequisition == '')) {
                        const _idSalesOrder = _salesOrderData.id;
                        const _createPurchaseRequisition = purchase_requisition_service.createPurchaseRequisition(_salesOrderData);
                        let _updateSalesOrder = sales_order_service.upadtePurchaseRequistion(_idSalesOrder, _createPurchaseRequisition);

                        log.debug({ title: 'afterSubmit - _dontCreateRequisition', details: _dontCreateRequisition });
                        log.debug(`Linha 148 - afterSubmit - id da sales order: ${_idSalesOrder}.`);
                        log.debug({ title: 'Linha 149 - afterSubmit - retorno de script requisição', details: _createPurchaseRequisition });
                        log.debug({ title: 'Linha 150 - afterSubmit - retorno de atualização S.O.', details: `Sales Order foi atualizada: ${_updateSalesOrder}` });

                        return true;
                    }

                    const _salesOrderStatus = _salesOrderData.orderStatus;

                    if (_salesOrderStatus == 'B' || _salesOrderStatus == 'E') {
                        const _idPurchaseRequisition = _salesOrderData.purchaseRequisition.id;
                        const _purchaseRequisitionData = purchase_requisition_service.getByStatus(_idPurchaseRequisition);

                        if (_purchaseRequisitionData === 'Fully Ordered') {
                            throw `The Purchase Requisition has now been fully met!`;
                        } else if (_purchaseRequisitionData === 'Rejected') {
                            throw `The Purchase Requisition is Rejected!`;
                        } else {
                            const _purchaseRequisitionDataFull = purchase_requisition_service.getRequisitionData(_idPurchaseRequisition);
                            const _requistion = purchase_requisition_service.readData(_purchaseRequisitionDataFull);

                            // ============================================================
                            //^ NOVA LÓGICA: sincronização por referência
                            // ============================================================
                            const _oRecord = context.oldRecord;
                            const _oldSalesOrderData = sales_order_service.readData(_oRecord);

                            let _delta = sales_order_service.computeDeltaForPR(
                                _salesOrderData.itemList,
                                _oldSalesOrderData.itemList
                            );

                            // Inserções novas
                            if ((_delta.itemsToInsert || []).length) {
                                let _idCustomer = _salesOrderData.customerId;
                                let _ins = purchase_requisition_service.insertionLine(
                                    _idPurchaseRequisition,
                                    _delta.itemsToInsert,
                                    _idCustomer
                                );
                                log.debug({ title: 'afterSubmit - insertionLine (delta)', details: _ins });
                            }

                            // Exclusões
                            if ((_delta.refsToRemove || []).length) {
                                let _rm = purchase_requisition_service.removeLine(
                                    _idPurchaseRequisition,
                                    _delta.refsToRemove
                                );
                                log.debug({ title: 'afterSubmit - removeLine (delta)', details: _rm });
                            }

                            // ============================================================
                            //^  Lógica existente (mantida) — atualização de itens iguais
                            // ============================================================
                            const _itemSalesSize = _salesOrderData.itemList.length;
                            const _itemRequistionSize = _requistion.itemList.length;

                            if (_itemSalesSize == _itemRequistionSize) {
                                const _actualItemSales = _salesOrderData.itemList;
                                const _oldItemSales = _oldSalesOrderData.itemList;
                                const _itemRequistion = _requistion.itemList;

                                const _hasItensChanged = purchase_requisition_service.hasDifferences(_actualItemSales, _oldItemSales);
                                log.debug({
                                    title: 'afterSubmit - Verificação de alterados de dados.',
                                    details: `Houve dados de itens alterados: ${_hasItensChanged}!`
                                });

                                if (_hasItensChanged == true) {
                                    const _itemsToUpdate = purchase_requisition_service.changedItemsList(_actualItemSales, _oldItemSales);
                                    const _updatedRequistion = purchase_requisition_service.updatedRequistion(_idPurchaseRequisition, _itemsToUpdate);
                                    log.debug({ title: 'afterSubmit - Retorno - _updatedRequistion.', details: _updatedRequistion });
                                }
                            }
                        }
                    }
                }
                const _updateEstimatedCostTotalPerLine = sales_order_service.updateEstimatedCostTotalPerLine(_cRecord.id);
                log.debug({
                    title: 'Linha 437 - afterSubmit - _updateEstimatedCostTotalPerLine',
                    details: _updateEstimatedCostTotalPerLine
                });


            } catch (error) {
                log.error({ title: 'afterSubmit - Erro de processamento ', details: error });
            }
        }

        return {
            beforeLoad: beforeLoad,
            beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
    })