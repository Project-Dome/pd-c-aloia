SELECT
    tl.custcol_aae_purchaseorder as purchaseOrderId,
    transaction.id as invoiceId,
    vendorBillLine.transaction as vendorBillId,
    tl.custcol_aae_buyer_purchase_order as buyer,
    tl.custcol_pd_cso_line_reference
FROM
    transaction
    INNER JOIN transactionline as tl ON tl.transaction = transaction.id
    AND mainline = 'F'
    AND taxline = 'F'
    AND tl.custcol_aae_purchaseorder IS NOT NULL
    INNER JOIN transactionline as vendorBillLine ON vendorBillLine.createdfrom = tl.custcol_aae_purchaseorder
    AND vendorBillLine.mainline = 'F'
    AND vendorBillLine.taxline = 'F'
    AND vendorBillLine.custcol_pd_cso_line_reference = tl.custcol_pd_cso_line_reference
    INNER JOIN transaction as vendorbill on vendorbill.id = vendorBillLine.transaction
    AND vendorbill.recordtype = 'vendorbill'
    LEFT JOIN customrecord_pd_pos_approval_saving AS aps ON aps.custrecord_pd_pos_pas_transaction = vendorBillLine.transaction
    AND aps.custrecord_pd_pos_pas_employee = tl.custcol_aae_buyer_purchase_order
WHERE
    transaction.status = 'CustInvc:B'
    AND transaction.recordtype = 'invoice' --  AND transaction.id in (8024, 8025)
    AND aps.id IS NULL
GROUP BY
    tl.custcol_aae_purchaseorder,
    transaction.id,
    vendorBillLine.transaction,
    tl.custcol_aae_buyer_purchase_order,
    tl.custcol_pd_cso_line_reference











--     SELECT
--     tl.custcol_aae_purchaseorder as purchaseOrderId,
--     transaction.id as invoiceId,
--     vendorBillLine.transaction as vendorBillId,
--     tl.custcol_aae_buyer_purchase_order as buyer,
--     tl.custcol_pd_cso_line_reference,
--     max(potl.linesequencenumber) as poline
-- FROM
--     transaction
--     INNER JOIN transactionline as tl ON tl.transaction = transaction.id
--     and mainline = 'F'
--     and taxline = 'F'
--     and tl.custcol_aae_purchaseorder IS NOT NULL

--     INNER JOIN transactionline as potl ON potl.transaction = tl.custcol_aae_purchaseorder
--     and potl.mainline = 'F'
--     and potl.taxline = 'F'
--     and potl.custcol_pd_cso_line_reference = tl.custcol_pd_cso_line_reference

--     INNER JOIN transactionline as vendorBillLine ON vendorBillLine.createdfrom = tl.custcol_aae_purchaseorder
--     and vendorBillLine.mainline = 'F'
--     and vendorBillLine.taxline = 'F'
--     INNER JOIN transaction as vendorbill on vendorbill.id = vendorBillLine.transaction
--     and vendorbill.recordtype = 'vendorbill'
--     LEFT JOIN customrecord_pd_pos_approval_saving AS aps ON aps.custrecord_pd_pos_pas_transaction = vendorBillLine.transaction
-- WHERE
--     transaction.status = 'CustInvc:B'
--     and transaction.recordtype = 'invoice'
--     and transaction.id in (8024, 8025)
--     and aps.id IS NULL
-- GROUP BY
--     tl.custcol_aae_purchaseorder,
--     transaction.id,
--     vendorBillLine.transaction,
--     tl.custcol_aae_buyer_purchase_order,
--     tl.custcol_pd_cso_line_reference 