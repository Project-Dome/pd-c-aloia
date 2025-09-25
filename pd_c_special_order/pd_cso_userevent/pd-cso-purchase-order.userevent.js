/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define([
  'N/record',
  'N/log',

  '../pd_cso_service/pd-cso-purchase-requisition.service',
  '../pd_cso_service/pd-cso-sales-order.service'
], function (
  record,
  log,
  purchase_requisition_service,
  sales_order_service
) {

  function afterSubmit(context) {
    try {
      const _cRecord = context.newRecord;
      log.debug({ title: 'afterSubmit - Registro submetido (PO)', details: _cRecord.id });

      // Se quiser limitar só à criação, descomente a linha abaixo
      // if (context.type !== context.UserEventType.CREATE) return;

      // 1) Carrega o PO para ler as linhas
      const poId = _cRecord.id;
      const poRec = record.load({ type: record.Type.PURCHASE_ORDER, id: poId, isDynamic: false });
      log.debug({ title: 'afterSubmit - PO carregado', details: poId });

      // 2) Coleta PRs distintas a partir das linhas do PO (item.requisition)
      const prIds = collectRequisitionsFromPO(poRec);
      log.debug({ title: 'afterSubmit - PRs distintas encontradas no PO', details: JSON.stringify(prIds) });

      if (!prIds.length) {
        log.debug({ title: 'afterSubmit - Nenhuma Requisição vinculada ao PO (item.requisition vazio)', details: null });
        return;
      }

      // 3) Para cada PR encontrada, executa as três ações na ordem solicitada
      prIds.forEach(function (prId) {
        try {
          log.debug({ title: 'afterSubmit - Processando PR', details: prId });

          // PR -> dados
          const prRec = record.load({ type: record.Type.PURCHASE_REQUISITION, id: prId, isDynamic: false });
          const _purchaseRequisitionData = purchase_requisition_service.readData(prRec);
          log.debug({ title: 'afterSubmit - Dados da Requisição', details: JSON.stringify(_purchaseRequisitionData) });

          // SO origem (exposta pelo readData da PR)
          const _idSalesOrder = _purchaseRequisitionData && _purchaseRequisitionData.salesOrder;
          log.debug({ title: 'afterSubmit - ID da Sales Order vinculada', details: _idSalesOrder });

          if (!_idSalesOrder) {
            log.debug({ title: 'afterSubmit - Nenhuma Sales Order vinculada à PR, pulando PR', details: prId });
            return;
          }

          // SO -> dados
          const _salesOrderOptions = sales_order_service.getSalesData(_idSalesOrder);
          log.debug({ title: 'afterSubmit - Opções da Sales Order', details: JSON.stringify(_salesOrderOptions) });

          const _salesOrderData = sales_order_service.readData(_salesOrderOptions);
          log.debug({ title: 'afterSubmit - Dados da Sales Order', details: JSON.stringify(_salesOrderData) });

          // 1) syncLinkedOrders
          const _syncLinkedOrders = sales_order_service.syncLinkedOrders(_purchaseRequisitionData, _salesOrderData);
          log.debug({ title: 'afterSubmit - Resultado do syncLinkedOrders', details: JSON.stringify(_syncLinkedOrders) });

          // 2) updateSalesOrder
          const _updateSalesOrder = sales_order_service.updateSalesOrder(_syncLinkedOrders);
          log.debug({ title: 'afterSubmit - Resultado do updateSalesOrder', details: JSON.stringify(_updateSalesOrder) });

          // 3) updateVendor (somente linhas da PR que apontam para ESTE PO)
          const _prDataOnlyThisPO = {
            id: _purchaseRequisitionData.id,
            itemList: (_purchaseRequisitionData.itemList || []).filter(function (line) {
              return line.linkedOrder && line.linkedOrder[0] == poId;
            })
          };

          let _updateRequistion = null;
          if (_prDataOnlyThisPO.itemList.length) {
            _updateRequistion = purchase_requisition_service.updateVendor(_prDataOnlyThisPO);
            log.debug({ title: 'afterSubmit - Resultado do updateVendor (somente linhas desta PR->PO)', details: JSON.stringify(_updateRequistion) });
          } else {
            log.debug({ title: 'afterSubmit - PR sem linhas vinculadas ao PO atual para updateVendor (ok)', details: { prId, poId } });
          }

          log.debug({
            title: 'afterSubmit - PR processada com sucesso',
            details: { purchaseOrderId: poId, purchaseRequisitionId: prId, salesOrderId: _idSalesOrder }
          });

        } catch (innerErr) {
          log.error({ title: 'afterSubmit - Erro ao processar PR vinculada ao PO', details: { poId, prId, error: innerErr } });
        }
      });

    } catch (error) {
      log.error({ title: 'afterSubmit - Erro de processamento (PO)', details: error });
    }
  }

  // Coleta ids únicos de PR lendo item.requisition nas linhas do PO
  function collectRequisitionsFromPO(poRec) {
    const reqSet = new Set();
    const lineCount = poRec.getLineCount({ sublistId: 'item' }) || 0;

    log.debug({ title: 'collectRequisitionsFromPO - lineCount', details: lineCount });

    for (let i = 0; i < lineCount; i++) {
      const prId = poRec.getSublistValue({
        sublistId: 'item',
        fieldId: 'linkedorder',
        line: i
      });

      if (prId) {
        log.debug({ title: 'collectRequisitionsFromPO - Linha com PR encontrada', details: { line: i, prId } });
        reqSet.add(String(prId));
      }
    }
    return Array.from(reqSet);
  }

  return { afterSubmit: afterSubmit };
});
