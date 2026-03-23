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
        'N/ui/dialog'
    ],
    function (
        currentRecord,
        url,
        https,
        dialog
    ) {

        function createPurchaseRequisition() {
            try {

                const _currentRecord = currentRecord.get();
                const _idSalesOrder = _currentRecord.id;

                if (!_idSalesOrder) {
                    dialog.alert({
                        title: 'Atenção',
                        message: 'Salve a Sales Order antes de criar a Purchase Requisition.'
                    });
                    return;
                }

                const _purchaseRequisition = _currentRecord.getValue({
                    fieldId: 'custbody_pd_cso_linked_requistion'
                });

                if (_purchaseRequisition) {
                    dialog.alert({
                        title: 'Atenção',
                        message: 'Já existe uma Purchase Requisition vinculada a esta Sales Order.'
                    });
                    return;
                }

                dialog.confirm({
                    title: 'Confirmação',
                    message: 'Deseja criar a Purchase Requisition?'
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
                            title: 'Sucesso',
                            message: 'Purchase Requisition criada com sucesso.'
                        }).then(function () {
                            window.location.reload();
                        });
                        return;
                    }

                    dialog.alert({
                        title: 'Erro',
                        message: _body.message || 'Erro ao criar Purchase Requisition.'
                    });

                }).catch(function (_error) {
                    console.log('_error confirm dialog', _error);
                });

            } catch (_error) {
                console.log('_error createPurchaseRequisition', _error);

                dialog.alert({
                    title: 'Erro',
                    message: 'Ocorreu um erro ao executar a criação da Purchase Requisition.'
                });
            }
        }

        return {
            createPurchaseRequisition: createPurchaseRequisition
        };

    });