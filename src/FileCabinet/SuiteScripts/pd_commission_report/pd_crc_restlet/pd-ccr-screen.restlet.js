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
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-restlet.util',
        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        runtime,
        search,
        log,
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
            customer: { name: "mainname" },
            custPO: { name: "otherrefnum" },
            soAck: { name: "tranid", join: "createdFrom" },
            urgency: { name: "custbody_aae_urgency_order" },
            buyer: { name: "custbody_aae_buyer" },
            custPOReceipt: { name: "custbody_aae_cust_po_receipt" },
            salesAdmin: { name: "salesrep" },
            deliveryDate: { name: "custbody_aae_delivery_date" },
            partNumber: { name: "item" },
            description: { name: "salesdescription", join: "item" },
            qty: { name: "quantity" },
            soldEAUSD: { name: "rate" },
            supplierVendor: { name: "custcol_aae_vendor_purchase_order" },
            poVendor: { name: "tranid", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            vendorPODate: { name: "trandate", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            vendorShipDate: { name: "expectedreceiptdate", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            vendorTerms: { name: "terms", join: "CUSTCOL_AAE_PURCHASE_ORDER_LINKED" },
            stockAloia: { name: "formulanumeric", formula: FORMULA.stockAloia },
            dateINV: { name: "trandate" },
            customerInvoice: { name: "tranid" },
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
            commission: { name: "salesrep" },
            customerCommissionPercent: { name: "custentity_aae_comission_rates", join: "customer" },
            usdCommission: { name: "formulacurrency", formula: FORMULA.usdCommission }
        };

        function executeInvoiceReport() {
            var results = [];

            search_util.all({
                type: TYPE,
                columns: FIELDS,
                filters: [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["taxline", "is", "F"],
                    "AND",
                    ["mainline", "any", ""],
                    "AND",
                    ["shipping", "is", "F"]
                ],
                each: function (line) {
                    results.push(line);
                }
            });

            return { success: true, data: results };
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
