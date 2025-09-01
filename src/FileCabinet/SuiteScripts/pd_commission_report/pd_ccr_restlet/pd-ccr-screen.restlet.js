/**
 *@NApiVersion 2.1
 *@NScriptType Restlet
 *Author: Lucas Monaco 
 */
define(
    [
        'N/runtime',
        'N/search',
        'N/log',
        'N/url',
        'N/query',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-restlet.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        runtime,
        search,
        log,
        url,
        query,
        search_util,
        restlet_util,
        common_util
    ) {

        const TYPE = 'invoice';

        const FORMULA = {
            percent: `{amount}/(({custcol_aae_purchase_order_linked.rate}*{custcol_aae_purchase_order_linked.quantity})+(NVL({item.quantityavailable}, 0)*{custcol_aae_purchase_order_linked.quantity})+{custcol_aae_purchase_order_linked.custbody_aee_freight_cost_vendor}+{custcol_aae_purchase_order_linked.custbody_aae_hazmat_aog_other_fees}+{shippingcost}+{handlingcost})/100`,
            stockAloia: `NVL({item.quantityavailable}, 0)`,
            totalCostUSD: `({custcol_aae_purchase_order_linked.rate}*{custcol_aae_purchase_order_linked.quantity})+(NVL({item.quantityavailable}, 0)*{custcol_aae_purchase_order_linked.quantity})+{custcol_aae_purchase_order_linked.custbody_aee_freight_cost_vendor}+{custcol_aae_purchase_order_linked.custbody_aae_hazmat_aog_other_fees}+{shippingcost}+{handlingcost}`,
            costEAUSD: `(( {custcol_aae_purchase_order_linked.rate} * {custcol_aae_purchase_order_linked.quantity}) + (NVL({item.quantityavailable},0)*{custcol_aae_purchase_order_linked.quantity}) + {custcol_aae_purchase_order_linked.custbody_aee_freight_cost_vendor} + {custcol_aae_purchase_order_linked.custbody_aae_hazmat_aog_other_fees} + {shippingcost} + {handlingcost}) / ({quantity} + NVL({item.quantityavailable},0))`,
            operationalProfitUSD: `{amount}-(({custcol_aae_purchase_order_linked.rate}*{custcol_aae_purchase_order_linked.quantity})+(NVL({item.quantityavailable}, 0)*{custcol_aae_purchase_order_linked.quantity})+{custcol_aae_purchase_order_linked.custbody_aee_freight_cost_vendor}+{custcol_aae_purchase_order_linked.custbody_aae_hazmat_aog_other_fees}+{shippingcost}+{handlingcost})`,
            salesCommission: `NVL({applyingtransaction.trandate}, {trandate})+60`,
            usdCommission: `({amount} - (({custcol_aae_purchase_order_linked.rate}*{custcol_aae_purchase_order_linked.quantity}) + (NVL({item.quantityavailable},0)*{custcol_aae_purchase_order_linked.quantity}) + {custcol_aae_purchase_order_linked.custbody_aee_freight_cost_vendor} + {custcol_aae_purchase_order_linked.custbody_aae_hazmat_aog_other_fees} + {shippingcost} + {handlingcost}))*0.005`

        };
        const FIELDS = {
            transactionRecordType: { name: 'recordtype' },
            transactionId: { name: 'internalid' },
            tranID: { name: "tranid" },
            entityid: { name: "entityid", join: "customer" },
            companyname: { name: "companyname", join: "customer" },
            customer: { name: "formulatext", formula: "{customer.entityid} || ' ' ||  {customer.companyname}" },
            customerId: { name: "internalid", join: "customer" },
            custPO: { name: "otherrefnum" },
            soAck: { name: "tranid", join: "createdFrom" },
            soAckId: { name: "internalid", join: "createdFrom" },
            urgency: { name: "formulatext", formula: "{custbody_aae_urgency_order}" },
            buyer: { name: "formulatext", formula: "{custbody_aae_buyer.firstname} || ' ' || {custbody_aae_buyer.lastname}" },
            buyerId: { name: "internalid", join: "custbody_aae_buyer" },
            custPOReceipt: { name: "custbody_aae_cust_po_receipt" },
            salesAdmin: { name: "formulatext", formula: "{salesrep.firstname} || ' ' || {salesrep.lastname}" },
            salesAdminId: { name: "internalid", join: "salesrep" },
            deliveryDate: { name: "custbody_aae_delivery_date" },
            partNumber: { name: "itemid", join: "item" },
            description: { name: "salesdescription", join: "item" },
            qty: { name: "quantity" },
            soldEAUSD: { name: "rate" },
            supplierVendor: { name: "companyname", join: "custcol_aae_vendor_purchase_order" },
            supplierVendorId: { name: "internalid", join: "custcol_aae_vendor_purchase_order" },
            poVendor: { name: "tranid", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            poVendorId: { name: "internalid", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            vendorPODate: { name: "trandate", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            vendorShipDate: { name: "expectedreceiptdate", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            vendorTerms: { name: "formulatext", formula:"{CUSTCOL_AAE_PURCHASE_ORDER_LINKED.terms}" },
            stockAloia: { name: "formulanumeric", formula: FORMULA.stockAloia },
            dateINV: { name: "trandate" },
            customerInvoice: { name: "tranid" },
            customerInvoiceId: { name: "internalid" },
            freightAloiaToCustomer: { name: "shippingcost" },
            freightVendorToAloia: { name: "custbody_aee_freight_cost_vendor", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            bhCost: { name: "handlingcost" },
            hazmatFees: { name: "custbody_aae_hazmat_aog_other_fees", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            unitCostVendorUSD: { name: "rate", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            totalCostUSD: { name: "formulacurrency", formula: FORMULA.totalCostUSD },
            costEAUSD: { name: "formulanumeric", formula: FORMULA.costEAUSD },
            totalSalesSold: { name: "amount" },
            operationalProfitUSD: { name: "formulacurrency", formula: FORMULA.operationalProfitUSD },
            percent: { name: "formulapercent", formula: FORMULA.percent },
            paidByCustomerOn: { name: "trandate", join: "applyingTransaction" },
            salesCommission: { name: "formuladate", formula: FORMULA.salesCommission },
            commission: { name: "formulatext", formula: "{salesrep.firstname} || ' ' || {salesrep.lastname}" },
            customerCommissionPercent: { name: "custentity_aae_comission_rates", join: "customer" },
            usdCommission: { name: "formulacurrency", formula: FORMULA.usdCommission },
            mainLine: { name: "mainline", onlyFilter: true },
            cogs: { name: "cogs", onlyFilter: true },
            shipping: { name: "shipping", onlyFilter: true },
            taxline: { name: "taxline", onlyFilter: true },
            type: { name: "type", onlyFilter: true },
            status: { name: "custrecord_pd_ccr_status", join: "custrecord_pd_ccr_transaction", onlyFilter: true }
        };

        function executeInvoiceReport() {

            var results = [];
            //let _query = buildQuery();
            search_util.all({
                type: TYPE,
                columns: FIELDS,
                query:search_util
                        .where(search_util.query(FIELDS.type, 'anyof', "CustInvc"))
                        .and(search_util.query(FIELDS.cogs, 'is', "F"))
                        .and(search_util.query(FIELDS.taxline, 'is', "F"))
                        .and(search_util.query(FIELDS.shipping, 'is', "F"))
                        .and(search_util.query(FIELDS.mainLine, 'is', "F"))
                        .and(search_util.query(FIELDS.status, 'anyof', "3")),
                each: function (data) {
                    let _hasUSDComission = !isNullOrEmpty(data.usdCommission);
                    if (!_hasUSDComission) return;

                    log.audit("Invoice Data", data);

                    data['transactionUrl'] = buildRecordUrl(data.transactionRecordType, data.transactionId);

                    if (data.soAckId) data['soAckUrl'] = buildRecordUrl('salesorder', data.soAckId);

                    if (data.buyerId) data['buyerUrl'] = buildRecordUrl('employee', data.buyerId);

                    if (data.salesAdminId) data['salesAdminUrl'] = buildRecordUrl('employee', data.salesAdminId);

                    if (data.supplierVendorId) data['supplierVendorUrl'] = buildRecordUrl('vendor', data.supplierVendorId);

                    if (data.poVendorId) data['poVendorUrl'] = buildRecordUrl('purchaseorder', data.poVendorId);

                    if (data.customerInvoiceId) data['customerInvoiceUrl'] = buildRecordUrl('invoice', data.customerInvoiceId);

                    if (data.customerId) data['customerUrl'] = buildRecordUrl('customer', data.customerId);

                    results.push(data);
                }
            })

            log.audit("Invoice Report Results", results);

            return { success: true, data: results };
        }

        // function buildQuery() {
        //     return [
        //         "SELECT",
        //         "   ap.id AS rtId,",
        //         "   tl.*",
        //         "FROM",
        //         "   transaction",
        //         "INNER JOIN customrecord_pd_ccr_approval_comission ap",
        //         "   ON ap.custrecord_pd_ccr_transaction = transaction.id",
        //         "INNER JOIN transactionline tl",
        //         "   ON tl.transaction = transaction.id",
        //         "   AND tl.mainline = 'F'",
        //         "   AND tl.taxline = 'F'",
        //         "   AND tl.iscogs = 'F'",
        //         "   AND tl.itemtype != 'ShipItem'",
        //         "WHERE",
        //         "   transaction.recordtype = 'invoice'",
        //         "   AND ap.custrecord_pd_ccr_status = '3'",
        //         "   AND ap.custrecord_pd_ccr_transaction = transaction.id",
        //         "   AND ap.id IS NOT NULL"
        //     ].join(" ");
        // }

        function buildRecordUrl(recordType, recordId) {
            return url.resolveRecord({
                recordType: recordType,
                recordId: recordId
            });
        }

        function postHandler(context) {
            try {
                return executeInvoiceReport();
            } catch (e) {
                log.error("Error generating invoice report", e);
                return { error: e.message };
            }
        }

        return {
            post: postHandler
        }
    }
);
