/**
 * @NApiVersion     2.1
 * @NScriptType     UserEventScript
 * @NModuleScope    SameAccount
 * @author          Project Dome - Rogério Gonçalves Rodrigues
 */

define([

    'N/log',
    '../pd_cso_service/pd-cso-purchase-order.service',
    '../pd_cso_service/pd-cso-sales-order.service'

], function (
    
    log,
    purchase_order_service,
    sales_order_service
) {

    function afterSubmit(context) {
        try {

            if (
                context.type !== context.UserEventType.CREATE &&
                context.type !== context.UserEventType.EDIT
            ) {
                return;
            }

            const _newRecord = context.newRecord;
            const _purchaseOrderId = _newRecord.id;
            const _createdFrom = _newRecord.getValue({ fieldId: 'createdfrom' });

            log.debug({
                title: 'PO -> SO Sync | Início',
                details: {
                    eventType: context.type,
                    purchaseOrderId: _purchaseOrderId,
                    createdfrom: _createdFrom
                }
            });

            if (!_purchaseOrderId) {
                return;
            }

            if (!_createdFrom) {
                log.debug({
                    title: 'PO -> SO Sync | createdfrom vazio',
                    details: _purchaseOrderId
                });
                return;
            }

            if (!sales_order_service.isSalesOrder(_createdFrom)) {
                log.debug({
                    title: 'PO -> SO Sync | Origem não é Sales Order',
                    details: _createdFrom
                });
                return;
            }

            const _purchaseOrderSyncPayload =
                purchase_order_service.buildPurchaseOrderToSalesOrderSyncPayload({
                    purchaseOrderId: _purchaseOrderId,
                    salesOrderId: _createdFrom
                });

            sales_order_service.applyPurchaseOrderToSalesOrderSync(
                _purchaseOrderSyncPayload
            );

            log.debug({
                title: 'PO -> SO Sync | Fim',
                details: {
                    purchaseOrderId: _purchaseOrderId,
                    salesOrderId: _createdFrom
                }
            });

        } catch (error) {
            log.error({
                title: 'PO -> SO Sync | Erro',
                details: error
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };

});