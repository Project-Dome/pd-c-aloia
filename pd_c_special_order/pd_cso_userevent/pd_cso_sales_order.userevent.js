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

                log.debug({ title: `afterSubmit - Dados da sales order`, details: _salesOrderData });

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
                log.error({ title: 'beforeLoad - Erro de processameto ', details: error });

            }

        }

        // function beforeSubmit(context) {

        //     try {

                // if (runtime.getCurrentUser().role === 3) {  // Administrador realizar qualquer manioulaçãopode tudo

                //     return; 
                // }

                // const _cRecord = context.newRecord;
                // const _oRecord = context.oldRecord;

                // const _newSalesOrderData = sales_order_service.readData(_cRecord);
                // const _oldSalesOrderData = sales_order_service.readData(_oRecord);

                // log.debug({ title: 'beforeSubmit - _newSalesOrderData', details: _newSalesOrderData.itemList });
                // log.debug({ title: 'beforeSubmit - _oldSalesOrderData', details: _oldSalesOrderData.itemList });

                // const _blockEditing = sales_order_service.blockEditing(_oldSalesOrderData, _newSalesOrderData);
                // log.debug({ title: 'Linha 113 - _blockEditing', details: _blockEditing });

            // } catch (error) {
            //     log.error({ title: 'beforeLoad - Erro de processameto ', details: error });

            // }
        // }

        function afterSubmit(context) {
            try {
                const _contextType = context.type

                if ((_contextType !== context.UserEventType.CREATE) && (_contextType !== context.UserEventType.EDIT)) {
                    log.debug('Processo não será executado.');
                    return;
                }

                const _cRecord = context.newRecord;
                const _salesOrderData = sales_order_service.readData(_cRecord);

                // log.debug(`afterSubmit - context da sales order: ${_cRecord}.`);
                log.debug({ title: `afterSubmit - Dados da sales order`, details: _salesOrderData });

                let _purchaseRequisition = _cRecord.getValue({ fieldId: 'custbody_pd_cso_linked_requistion' });
                let _dontCreateRequisition = _cRecord.getValue({ fieldId: 'custbody_pd_cso_dont_create_req' });

                log.debug({ title: 'afterSubmit - _purchaseRequisition', details: _purchaseRequisition });
                // log.debug({ title: 'afterSubmit - _dontCreateRequisition', details: _dontCreateRequisition });

                const _validateItems = sales_order_service.validateItems(_salesOrderData.itemList);

                if (_contextType == context.UserEventType.CREATE) {

                    if (_validateItems && (_dontCreateRequisition === false)) {

                        // log.debug({ title: 'afterSubmit - _purchaseRequisition', details: _purchaseRequisition });
                        log.debug({ title: 'afterSubmit - _dontCreateRequisition', details: _dontCreateRequisition });

                        const _idSalesOrder = _salesOrderData.id;
                        const _createPurchaseRequisition = purchase_requisition_service.createPurchaseRequisition(_salesOrderData);
                        let _updateSalesOrder = sales_order_service.upadtePurchaseRequistion(_idSalesOrder, _createPurchaseRequisition);

                        // log.debug(`Linha 65 - afterSubmit - id da sales order: ${_idSalesOrder}.`);
                        // log.debug({ title: 'Linha 66 - afterSubmit - retorno de script requsição', details: _createPurchaseRequisition });
                        // log.debug({ title: 'Linha 67 - afterSubmit - retorno de atualização S.O.', details: `Sales Order foi atualizada: ${_updateSalesOrder}` });

                    }
                }

                if (_contextType == context.UserEventType.EDIT) {

                    // const _hasPurchaseRequisition = !isNullOrEmpty(_purchaseRequisition);
                    // log.debug({ title: 'afterSubmit - linha 165 - _hasPurchaseRequisition', details: _hasPurchaseRequisition });

                    if (_validateItems && (_dontCreateRequisition === false) && (_purchaseRequisition == '')) {
                        
                        // // TODO: HÁ REQUISIÇÃO CRIADA - INTERROMPE PROCESSO
                        // if (_hasPurchaseRequisition) {
                        //     return;
                        // }
                        
                        log.debug({ title: 'Linha 174 - afterSubmit - _validarItens', details: _validateItems });
                        const _idSalesOrder = _salesOrderData.id;
                        const _createPurchaseRequisition = purchase_requisition_service.createPurchaseRequisition(_salesOrderData);
                        let _updateSalesOrder = sales_order_service.upadtePurchaseRequistion(_idSalesOrder, _createPurchaseRequisition);

                        log.debug({ title: 'afterSubmit - _dontCreateRequisition', details: _dontCreateRequisition });
                        log.debug(`Linha 180 - afterSubmit - id da sales order: ${_idSalesOrder}.`);
                        log.debug({ title: 'Linha 181 - afterSubmit - retorno de script requsição', details: _createPurchaseRequisition });
                        log.debug({ title: 'Linha 182 - afterSubmit - retorno de atualização S.O.', details: `Sales Order foi atualizada: ${_updateSalesOrder}` });

                        return true;
                    }


                    const _salesOrderStatus = _salesOrderData.orderStatus;
                    const _legendStatus = _salesOrderData.status;

                    if (_salesOrderStatus == 'B' || _salesOrderStatus == 'E') {

                        const _idPurchaseRequisition = _salesOrderData.purchaseRequisition.id;
                        const _hasPurchaseRequisition = _salesOrderData.createPurchaseRequisition;

                        // log.debug({ title: 'afterSubmit - Retornar os valores de status - contexto de edição', details: `orderStatus: ${_salesOrderStatus}  -->  legend: ${_legendStatus}` });
                        // log.debug({ title: `afterSubmit - campos customizados Purchase Requistion `, details: `_idPurchaseRequisition: ${_idPurchaseRequisition}  -->  _hasPurchaseRequisition: ${_hasPurchaseRequisition}.` });

                        // TODO:  status:"Fully Ordered" (PR)
                        // TODO:  status:"Rejected" (PR)

                        const _purchaseRequisitionData = purchase_requisition_service.getByStatus(_idPurchaseRequisition);

                        if (_purchaseRequisitionData === 'Fully Ordered') {
                            throw `The Purchase Requisition has now been fully met!`
                        } else if (_purchaseRequisitionData === 'Rejected') {
                            throw `The Purchase Requisition is Rejected!`
                        } else {

                            const _purchaseRequisitionData = purchase_requisition_service.getRequisitionData(_idPurchaseRequisition);
                            const _requistion = purchase_requisition_service.readData(_purchaseRequisitionData);

                            const _itemSalesSize = _salesOrderData.itemList.length;
                            const _itemRequistionSize = _requistion.itemList.length

                            // log.debug({ title: 'afterSubmit - dados da PR', details: _purchaseRequisitionData });
                            // log.debug({ title: 'afterSubmit - dados  de itens da SO ATUALIZADA', details: _salesOrderData.itemList });
                            // log.debug({ title: 'afterSubmit - _requistion dados da PR', details: _requistion.itemList });

                            // log.debug({ title: 'afterSubmit - tamanho do array da SO ATUALIZADA', details: _itemSalesSize });
                            // log.debug({ title: 'afterSubmit - Tamanho do array da PR', details: _itemRequistionSize });

                            if (_itemSalesSize > _itemRequistionSize) {

                                log.debug({ title: 'afterSubmit -_idPurchaseRequisition', details: _idPurchaseRequisition });
                                log.debug({ title: 'afterSubmit -_salesOrderData itemList', details: _salesOrderData.itemList });
                                log.debug({ title: 'afterSubmit -_requistion itemList', details: _requistion.itemList });

                                const _idCustomer = _salesOrderData.customerId;
                                const _itemsToInsert = purchase_requisition_service.itemsToInsert(_salesOrderData, _requistion);
                                log.debug({ title: 'afterSubmit - _itemsToInsert', details: _itemsToInsert });

                                const _insertioLine = purchase_requisition_service.insertionLine(_idPurchaseRequisition, _itemsToInsert, _idCustomer);
                                log.debug({ title: 'afterSubmit - _insertioLine', details: _insertioLine });

                            }

                            if (_itemSalesSize < _itemRequistionSize) {

                                const _getLineItem = purchase_requisition_service.getLineItem(_salesOrderData, _requistion);
                                log.debug({ title: 'afterSubmit - Lista de linhas para remoção.', details: _getLineItem });

                                const _removeLine = purchase_requisition_service.removeLine(_idPurchaseRequisition, _getLineItem);
                                log.debug({ title: 'afterSubmit - Retorno de remoção de linha', details: _removeLine });

                            }

                            if (_itemSalesSize == _itemRequistionSize) {

                                const _oRecord = context.oldRecord;
                                const _oldSalesOrderData = sales_order_service.readData(_oRecord);
                                const _actualItemSales = _salesOrderData.itemList;
                                const _oldItemSales = _oldSalesOrderData.itemList;
                                const _itemRequistion = _requistion.itemList;

                                // log.debug({ title: 'afterSubmit - dados da itens PR', details: _itemRequistion });
                                // log.debug({ title: 'afterSubmit - dados de itens da SO ATUALIZADA', details: _actualItemSales });
                                // log.debug({ title: 'afterSubmit - dados de itens da SO ANTERIOR', details: _oldItemSales });

                                const _hasItensChanged = purchase_requisition_service.hasDifferences(_actualItemSales, _oldItemSales);
                                log.debug({ title: 'afterSubmit - Verificação de alterados de dados.', details: `Houve dados de itens alterados: ${_hasItensChanged}!` })

                                if (_hasItensChanged == true) {

                                    log.debug({ title: 'afterSubmit - Verificação de alterados de dados.', details: _hasItensChanged })
                                    const _itemsToUpdate = purchase_requisition_service.changedItemsList(_actualItemSales, _oldItemSales);
                                    log.debug({ title: 'afterSubmit - Lista de items de alterados.', details: _itemsToUpdate })
                                    const _updatedRequistion = purchase_requisition_service.updatedRequistion(_idPurchaseRequisition, _itemsToUpdate);
                                    log.debug({ title: 'afterSubmit - Retorno - _updatedRequistion.', details: _updatedRequistion });

                                }

                            }

                        }
                    }
                }


            } catch (error) {
                log.error({ title: 'afterSubmit - Erro de processameto ', details: error });
            }

        }

        return {
            beforeLoad: beforeLoad,
            // beforeSubmit: beforeSubmit,
            afterSubmit: afterSubmit
        }
    })