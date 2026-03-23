/**
 * @NApiVersion     2.1
 * @NScriptType     ClientScript
 * @NModuleScope    SameAccount
 * @author          Project Dome - Rogério Gonçalves Rodrigues
 */

define(
    [
        'N/currentRecord',
        'N/url',
        'N/https',
        'N/ui/dialog',
        'N/log'
    ],
    function (
        currentRecord,
        url,
        https,
        dialog,
        log
    ) {

        function createPurchaseRequisition() {
            try {

                const _currentRecord = currentRecord.get();
                const _idSalesOrder = _currentRecord.id;

                if (!_idSalesOrder) {
                    dialog.alert({
                        title: 'Warning',
                        message: 'Please save the Sales Order before creating the Purchase Requisition.'
                    });
                    return;
                }

                const _purchaseRequisition = _currentRecord.getValue({
                    fieldId: 'custbody_pd_cso_linked_requistion'
                });

                if (_purchaseRequisition) {
                    dialog.alert({
                        title: 'Warning',
                        message: 'A Purchase Requisition is already linked to this Sales Order.'
                    });
                    return;
                }

                dialog.confirm({
                    title: 'Confirmation',
                    message: 'Do you want to create a Purchase Requisition?'
                }).then(function (_confirmed) {

                    if (!_confirmed) {
                        return;
                    }

                    const _suiteletUrl = url.resolveScript({
                        scriptId: 'customscript_pd_cso_purchase_requ_st',
                        deploymentId: 'customdeploy_pd_cso_purchase_requ_st',
                        params: {
                            salesOrderId: _idSalesOrder
                        }
                    });

                    const _response = https.get({
                        url: _suiteletUrl
                    });

                    const _body = JSON.parse(_response.body || '{}');

                    if (_body.success === true) {
                        dialog.alert({
                            title: 'Success',
                            message: 'Purchase Requisition created successfully.'
                        }).then(function () {
                            window.location.reload();
                        });
                        return;
                    }

                    dialog.alert({
                        title: 'Error',
                        message: _body.message || 'Error creating Purchase Requisition.'
                    });

                }).catch(function (_error) {
                    console.log('_error confirm dialog', _error);
                });

            } catch (_error) {
                console.log('_error createPurchaseRequisition', _error);

                dialog.alert({
                    title: 'Error',
                    message: 'An error occurred while creating the Purchase Requisition.'
                });
            }
        }

        function pageInit(context) {
            try {
                log.audit({
                    title: 'Aloia Client Script',
                    details: 'pageInit executado'
                });
            } catch (error) {
                log.error({
                    title: 'pageInit - erro', 
                    details: error
                });
            }
        }

        return {
            pageInit: pageInit,
            createPurchaseRequisition: createPurchaseRequisition
        }

    });