/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * Author: Lucas Monaco
 */
define([
    'N/url', 'N/currentRecord'
], 
function (
    url, currentRecord
) {

  function pageInit(context) {
  }

  function printPDF() {

    var record = currentRecord.get();
    console.log('Current Record:', record);

    var invoiceId = record.id;
    console.log('Invoice ID:', invoiceId);

    var suiteletUrl = url.resolveScript({
      scriptId: 'customscript_pd_aae_structurepdfsl',
      deploymentId: 'customdeploy_pd_aae_structurepdfsl',
      returnExternalUrl: false,
      params: { invoiceId: invoiceId }
    });
    console.log('Suitelet URL:', suiteletUrl);

    window.open(suiteletUrl, '_blank');
  }

  return {
    printPDF: printPDF,
    pageInit: pageInit
  };
});
