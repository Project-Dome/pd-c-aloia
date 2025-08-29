const RESTLET = {
    script: 'customscript_pd_ccr_search_comission',

    deployment: 'customdeploy_pd_ccr_search_comission_rt'
}

const APPROVE = {
    script: 'customscript_pd_ccr_approve_comission',
    deployment: 'customdeploy_pd_ccr_approve_comission_rt'
}

$(document).ready(function () {
    loadComissionReport();
})

function loadComissionReport() {
    post({
        restlet: RESTLET,
        onSuccess: function (response) {
            if (response.success && response.data) {
                loadPartnerTable({ page: { data: response.data } });
            } else {
                console.error('Erro ao carregar dados do Restlet', response);
            }
        }
    })
}

function loadPartnerTable(options) {
    var _listBody = $('#commission-table');
    var _listBodyContents = '';

    _listBody.children().remove();

    _listBodyContents += `

                <div class="table-responsive" style="width: 100%; overflow-x: auto;">
                <table class="table table-striped table-bordered align-middle"
                    style="--bs-table-hover-bg: transparent;">
                    <thead class="table-dark text-center">
                        <tr>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Select</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Invoice</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Customer</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Cust PO</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">SO/ACK</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Urgency</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Buyer</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Cust PO Receipt</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Sales ADMIN</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Delivery date</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Part Number</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Description</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">QTY</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Sold EA USD</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Supplier/Vendor</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">PO Vendor</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Vendor PO Date</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Vendor ship Date</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Vendor Terms</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Stock Aloia</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Date INV</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Customer Invoice</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Freight cost from Aloia to
                                customer</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Freight cost from vendor to
                                Aloia</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">B&H Cost</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Hazmat AOG otder fees</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Unit cost from vendor USD
                            </td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Total cost USD</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Cost EA USD</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Total sales sold</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Operation profit USD</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">%</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Paid by customer on</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Sales commission</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">Commission</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">% customer commission</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000; font-size: 20px">USD commission</td>
                        </tr>
                    </thead>
                    <tbody>
    `;

    options.page.data.forEach((lines) => {
        const tranId = lines.tranID ? `<a target="_blank" href="${lines.transactionUrl}"> ${lines.tranID} </a>` : '-';
        const soAck = lines.soAck ? `<a target="_blank" href="${lines.soAckUrl}">${lines.soAck}</a>` : '-';
        const buyer = lines.buyer ? `<a target="_blank" href="${lines.buyerUrl}">${lines.buyer}</a>` : '-';
        const salesAdmin = lines.salesAdmin ? `<a target="_blank" href="${lines.salesAdminUrl}">${lines.salesAdmin}</a>` : '-';
        const supplierVendor = lines.supplierVendor ? `<a target="_blank" href="${lines.supplierVendorUrl}">${lines.supplierVendor}</a>` : '-';
        const poVendor = lines.poVendor ? `<a target="_blank" href="${lines.poVendorUrl}">${lines.poVendor}</a>` : '-';
        const customerInvoice = lines.customerInvoice ? `<a target="_blank" href="${lines.customerInvoiceUrl}">${lines.customerInvoice}</a>` : '-';

        _listBodyContents += `
           <tr>
                <td class="text-center"><input type="checkbox" class="approve-check" value="${lines.id}" /></td>
                <td style="font-size: 15px;">${tranId}</td> 
                <td style="font-size: 15px;">${lines.customer}</td>
                <td style="font-size: 15px;">${lines.custPO}</td>
                <td style="font-size: 15px;">${soAck}</td>
                <td style="font-size: 15px;">${lines.urgency}</td>
                <td style="font-size: 15px;">${buyer}</td>
                <td style="font-size: 15px;">${lines.custPOReceipt}</td>
                <td style="font-size: 15px;">${salesAdmin}</td>
                <td style="font-size: 15px;">${lines.deliveryDate}</td>
                <td style="font-size: 15px;">${lines.partNumber}</td>
                <td style="font-size: 15px;">${lines.description}</td>
                <td style="font-size: 15px;">${lines.qty}</td>
                <td style="font-size: 15px;">${lines.soldEAUSD}</td>
                <td style="font-size: 15px;">${supplierVendor}</td>
                <td style="font-size: 15px;">${poVendor}</td>
                <td style="font-size: 15px;">${lines.vendorPODate}</td>
                <td style="font-size: 15px;">${lines.vendorShipDate}</td>
                <td style="font-size: 15px;">${lines.vendorTerms}</td>
                <td style="font-size: 15px;">${lines.stockAloia}</td>
                <td style="font-size: 15px;">${lines.dateINV}</td>
                <td style="font-size: 15px;">${customerInvoice}</td>
                <td style="font-size: 15px;">${lines.freightAloiaToCustomer}</td>
                <td style="font-size: 15px;">${lines.freightVendorToAloia}</td>
                <td style="font-size: 15px;">${lines.bhCost}</td>
                <td style="font-size: 15px;">${lines.hazmatFees}</td>
                <td style="font-size: 15px;">${lines.unitCostVendorUSD}</td>
                <td style="font-size: 15px;">${lines.totalCostUSD}</td>
                <td style="font-size: 15px;">${Number(lines.costEAUSD).toFixed(2)}</td>
                <td style="font-size: 15px;">${lines.totalSalesSold}</td>
                <td style="font-size: 15px;">${lines.operationalProfitUSD}</td>
                <td style="font-size: 15px;">${lines.percent}</td>
                <td style="font-size: 15px;">${lines.paidByCustomerOn}</td>
                <td style="font-size: 15px;">${lines.salesCommission}</td>
                <td style="font-size: 15px;">${lines.commission}</td>
                <td style="font-size: 15px;">${lines.customerCommissionPercent}%</td>
                <td style="font-size: 15px;">${lines.usdCommission}</td>
            </tr>
        `;
    });

    _listBodyContents += `
                        </tbody>
                    </table>
                </div>
    `;

    _listBody.append(_listBodyContents);
}

function getSelectedRTs() {
    let selected = [];
    $('.approve-check:checked').each(function () {
        selected.push($(this).val());
    });
    return selected;
}

function approve() {
    const selected = getSelectedRTs();
    if (!selected.length) {
        alert('Selecione pelo menos um registro para aprovar.');
        return;
    }

    post({
        restlet: APPROVE,
        data: {
            isApprov: true,
            records: selected
        },
        onSuccess: function (response) {
            loadComissionReport();
        }
    })
}

function reprov() {
    const selected = getSelectedRTs();
    if (!selected.length) {
        alert('Selecione pelo menos um registro para reprovar.');
        return;
    }

    post({
        restlet: APPROVE,
        data: {
            isApprov: false,
            records: selected
        },
        onSuccess: function (response) {
            if (response?.success) {
                loadComissionReport();
            } else {
                console.error('Erro ao reprovar registros', response);
            }
        }
    })
}