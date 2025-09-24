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

        '../pd_cso_service/pd-cso-sales-order.service',
        '../pd_cso_service/pd-cso-purchase-requisition.service',
        '../pd_cso_service/pd-cso-purchase-order.service',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',


        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'

    ],
    function (
        record,
        log,
        message,

        sales_order_service,
        purchase_requisition_service,
        purchase_order_service,


        search_util,
        record_util

    ) {

        function beforeLoad(context) {

            try {

                const _contextType = context.type;
                const _cRecord = context.newRecord;
                const _purchaseRequisitionData = purchase_requisition_service.readData(_cRecord);
                log.debug({ title: 'beforeLoad - dados da PR', details: _purchaseRequisitionData });
                log.debug({ title: 'beforeLoad - dados da PR - sub-lista de itens', details: _purchaseRequisitionData.itemList });
                // log.debug({ title: 'beforeLoad - dados da PR - id Purchase Order', details: _purchaseRequisitionData.itemList[0].linkedOrder.id });
                // log.debug({ title: 'beforeLoad - dados da PR - id Purchase Order', details: _purchaseRequisitionData.itemList[1].linkedOrder.id });

                // const _idPurchaseOrder1 = _purchaseRequisitionData.itemList[0].linkedOrder;
                // const _idPurchaseOrder2 = _purchaseRequisitionData.itemList[2].linkedOrder;

                // log.debug({ title: 'beforeLoad - _idPurchaseOrder1', details: _idPurchaseOrder1 });           
                // log.debug({ title: 'beforeLoad - _idPurchaseOrder2', details: _idPurchaseOrder2 }); 

                const _idSalesOrder = _purchaseRequisitionData.salesOrder;
                const _salesOrderOptions = sales_order_service.getSalesData(_idSalesOrder);
                const _salesOrderData = sales_order_service.readData(_salesOrderOptions);
                // log.debug({ title: 'beforeLoad - _idSalesOrder', details: _idSalesOrder });           
                // log.debug({ title: 'beforeLoad - dados da SO', details: _salesOrderData });

                const _syncLinkedOrders = sales_order_service.syncLinkedOrders(_purchaseRequisitionData, _salesOrderData);
                log.debug({ title: 'beforeLoad - _syncLinkedOrders', details: _syncLinkedOrders });

                const _updateSalesOrder = sales_order_service.updateSalesOrder(_syncLinkedOrders)
                log.debug({ title: 'beforeLoad - _updateSalesOrder', details: _updateSalesOrder });
                
                const _updateRequistion = purchase_requisition_service.updateVendor(_purchaseRequisitionData);
                log.debug({ title: 'beforeLoad - _updateRequistion', details: _updateRequistion });

            } catch (error) {

                log.error({ title: 'beforeLoad - Erro de processameto ', details: error });
            }

        }

        function afterSubmit(context) {

            try {

                const _contextType = context.type;
                const _cRecord = context.newRecord;
                const _purchaseRequisitionData = purchase_requisition_service.readData(_cRecord);
                // log.debug({ title: 'afterSubmit - dados da PR', details: _purchaseRequisitionData });

                // const _idPurchaseOrder1 = _purchaseRequisitionData.itemList[0].linkedOrder;
                // const _idPurchaseOrder2 = _purchaseRequisitionData.itemList[2].linkedOrder;

                // log.debug({ title: 'afterSubmit - _idPurchaseOrder1', details: _idPurchaseOrder1 });           
                // log.debug({ title: 'afterSubmit - _idPurchaseOrder2', details: _idPurchaseOrder2 }); 

                const _idSalesOrder = _purchaseRequisitionData.salesOrder;
                const _salesOrderOptions = sales_order_service.getSalesData(_idSalesOrder);
                const _salesOrderData = sales_order_service.readData(_salesOrderOptions);

                log.debug({ title: 'afterSubmit - _idSalesOrder', details: _idSalesOrder });           
                log.debug({ title: 'afterSubmit - dados da SO', details: _salesOrderData });

                const _syncLinkedOrders = sales_order_service.syncLinkedOrders(_purchaseRequisitionData, _salesOrderData);
                log.debug({ title: 'afterSubmit - _syncLinkedOrders', details: _syncLinkedOrders });

                const _updateSalesOrder = sales_order_service.updateSalesOrder(_syncLinkedOrders)
                log.debug({ title: 'afterSubmit - _updateSalesOrder', details: _updateSalesOrder });

                const _updateRequistion = purchase_requisition_service.updateVendor(_purchaseRequisitionData);
                log.debug({ title: 'beforeLoad - _updateRequistion', details: _updateRequistion });

            } catch (error) {
                log.error({ title: 'afterSubmit - Erro de processameto ', details: error });
            }

        }

        return {
            // beforeLoad: beforeLoad,
            afterSubmit: afterSubmit
        }

    })
