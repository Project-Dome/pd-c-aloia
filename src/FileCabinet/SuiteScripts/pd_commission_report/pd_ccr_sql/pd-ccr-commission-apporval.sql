SELECT
    distinct t.id AS vendorbillid,
    vendorBillLine.custcol_pd_sales_order_linked AS salesorderid,
    invoiceLine.transaction AS invoiceid
FROM
    transaction as t
    INNER JOIN transactionline AS vendorBillLine on vendorBillLine.transaction = t.id
    and vendorBillLine.mainline = 'F'
    and vendorBillLine.taxline = 'F'
    INNER JOIN transactionline AS invoiceLine ON invoiceLine.createdfrom = vendorBillLine.custcol_pd_sales_order_linked
    and invoiceLine.mainline = 'F'
    and invoiceLine.taxline = 'F'
    and invoiceLine.custcol_aae_purchaseorder IS NOT NULL
    LEFT JOIN customrecord_pd_ccr_approval_comission AS apc ON apc.custrecord_pd_ccr_transaction = invoiceLine.transaction
WHERE
    t.recordtype = 'vendorbill'
    and t.status = 'VendBill:B'
    and apc.id IS NULL