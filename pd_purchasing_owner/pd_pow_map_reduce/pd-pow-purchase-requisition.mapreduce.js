/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(
  ['N/search', 'N/log', '../pd_pow_service/pd-pow-purchase-requisition.service'],
  function (search, log, purchase_requisition_service) {

    function getInputData() {
      try {
        // Agora buscamos:
        // 1. PRs sem comprador (buyer vazio)
        // 2. PRs atribuídas a compradores com status "On Leave"        
        return search.create({
          type: 'purchaserequisition',
          filters: [
            [
              ['custbody_aae_buyer', 'anyof', '@NONE@'], // sem comprador
              'OR',
              ['custbody_aae_buyer.custentity_pd_pow_aae_onleave', 'is', 'T'] // comprador "On Leave"
            ],

            // TODO: ['status', 'anyof', 'PurchReq:B'], // ajuste se o status desejado for outro
            // TODO: 'AND', ['custbody_aae_buyer', 'anyof', '@NONE@'],
            'AND', ['mainline', 'is', 'T'],
            'AND', ['type', 'anyof', 'PurchReq'],
          ],
          columns: ['internalid', 'tranid', 'trandate','custbody_aae_buyer']
        });
      } catch (error) {
        log.error({ title: 'Error getInputData', details: error });
      }
    }

    function map(context) {
      try {
        const result = JSON.parse(context.value);

        // Formas comuns de vir o ID no JSON do search
        // result.id (string) OU result.values.internalid.value
        let prId =
          result.id ||
          (result.values && result.values.internalid && (result.values.internalid.value || result.values.internalid)) ||
          result.internalid;

        if (!prId) {
          log.error({
            title: 'Map - sem ID',
            details: { raw: context.value }
          });
          return;
        }

        const assigned = purchase_requisition_service.assignBuyerToPR(prId, { forceRedistribution: true });

        if (assigned) {
          log.debug({
            title: 'Map - PR atribuída a comprador',
            details: `PR ${prId} -> Buyer ${assigned}`
          });
        } else {
          log.debug({
            title: 'Map - PR sem comprador',
            details: `PR ${prId} permaneceu sem buyer`
          });
        }
      } catch (error) {
        log.error({ title: 'Error map function', details: error });
      }
    }

    // IMPORTANTE: receber o parâmetro summary
    function summarize(summary) {
      try {
        // Métricas gerais do script
        log.audit({
          title: 'Summarize - MR concluído',
          details: {
            dateCreated: summary.dateCreated,
            seconds: summary.seconds,
            usage: summary.usage,
            yields: summary.yields,
            concurrency: summary.concurrency
          }
        });

        // Erros de input
        if (summary.inputSummary && summary.inputSummary.error) {
          log.error({
            title: 'Summarize - erro em getInputData',
            details: summary.inputSummary.error
          });
        }

        // Erros do map
        if (summary.mapSummary && summary.mapSummary.errors) {
          summary.mapSummary.errors.iterator().each(function (key, e) {
            log.error({
              title: 'Summarize - erro no Map',
              details: `Key: ${key} | Error: ${e}`
            });
            return true;
          });
        }

        // (Se usar reduce no futuro, trate aqui também)
        if (summary.reduceSummary && summary.reduceSummary.errors) {
          summary.reduceSummary.errors.iterator().each(function (key, e) {
            log.error({
              title: 'Summarize - erro no Reduce',
              details: `Key: ${key} | Error: ${e}`
            });
            return true;
          });
        }

      } catch (error) {
        log.error({ title: 'Error summarize function', details: error });
      }
    }

    return {
      getInputData: getInputData,
      map: map,
      summarize: summarize
    };
  }
);
