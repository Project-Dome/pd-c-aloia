SELECT
    customrecord_pd_pos_approval_saving.id AS id,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_transaction AS transaction,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_status AS status,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_approver AS approver,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_approval_date AS approvalDate,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_rejector AS rejector,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_rejection_date AS rejectDate,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_vendor_bill AS vendorBill,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_commission_amount AS amountValue,
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_vendor AS vendorEmployee,
    tl.linesequencenumber AS lineNumber,
    tl.item as item,
    tl.foreignamount as foreignamount,
    tl.custcol_aae_estimated_cost_po as estimatedPO,
    tl.custcol_aae_final_cost_po AS finalCostPO,
    tl.quantity as quantity,
    tl.uniquekey as uniquekey
FROM
    customrecord_pd_pos_approval_saving
    INNER JOIN transaction AS t ON t.id = customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_transaction
    INNER JOIN transactionline AS tl ON tl.transaction = t.id
    AND tl.mainline = 'F'
    AND tl.taxline = 'F'
WHERE
    customrecord_pd_pos_approval_saving.custrecord_pd_pos_pas_status = 3