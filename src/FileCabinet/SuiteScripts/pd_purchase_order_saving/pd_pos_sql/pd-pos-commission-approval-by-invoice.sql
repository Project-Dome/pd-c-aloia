SELECT
    DISTINCT tl.custcol_aae_purchaseorder as purchaseOrderId,
    transaction.id as invoiceId,
    vendorBillLine.transaction as vendorBillId
FROM
    transaction
    INNER JOIN transactionline as tl ON tl.transaction = transaction.id
    and mainline = 'F'
    and taxline = 'F'
    and tl.custcol_aae_purchaseorder IS NOT NULL
    INNER JOIN transactionline as vendorBillLine ON vendorBillLine.createdfrom = tl.custcol_aae_purchaseorder
    and vendorBillLine.mainline = 'F'
    and vendorBillLine.taxline = 'F'
    INNER JOIN transaction as vendorbill on vendorbill.id = vendorBillLine.transaction and vendorbill.recordtype = 'vendorbill'
    LEFT JOIN customrecord_pd_pos_approval_saving AS aps ON aps.custrecord_pd_pos_pas_transaction = vendorBillLine.transaction
WHERE
    transaction.status = 'CustInvc:B'
    and transaction.recordtype = 'invoice'
    and aps.id IS NULL
