const RESTLET = {
    script: 'customscript_pd_ccr_search_comission',

    deployment: 'customdeploy_pd_ccr_search_comission_rt'
}

$(document).ready(function () {
    post({
        restlet: RESTLET,

        onSucess: function (response) {
            if (response.success && response.data) {
                loadPartnerTable({ page: { data: response.data } });
            } else {
                console.error('Erro ao carregar dados do Restlet', response);
            }
        }
    })
})

function loadPartnerTable(options) {
    var _listBody = $('#commission-table');
    var _listBodyContents = '';

    _listBody.children().remove();
    let = 0;
    _listBodyContents += `

                <div class="table-responsive">
                <table class="table table-striped table-bordered align-middle"
                    style="--bs-table-hover-bg: transparent;">
                    <thead class="table-dark text-center">
                        <tr>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Customer</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Cust PO</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">SO/ACK</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Urgency</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Buyer</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Cust PO Receipt</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Sales ADMIN</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Delivery date</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Part Number</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Description</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">QTY</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Sold EA USD</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Supplier/Vendor</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">PO Vendor</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Vendor PO Date</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Vendor ship Date</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Vendor Terms</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Stock Aloia</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Date INV</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Customer Invoice</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Freight cost from Aloia to
                                customer</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Freight cost from vendor to
                                Aloia</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">B&H Cost</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Hazmat AOG otder fees</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Unit cost from vendor USD
                            </td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Total cost USD</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Cost EA USD</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Total sales sold</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Operation profit USD</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">%</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Paid by customer on</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Sales commission</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">Commission</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">% customer commission</td>
                            <td style="white-space: nowrap; border-bottom: 2px solid #000;">USD commission</td>
                        </tr>
                    </thead>
                    <tbody>
    `;

    options.page.data.forEach((lines) => {
        _listBodyContents += `
           <tr>
                <td>${lines.customer}</td>
                <td>${lines.custPO}</td>
                <td>${lines.soAck}</td>
                <td>${lines.urgency}</td>
                <td>${lines.buyer}</td>
                <td>${lines.custPOReceipt}</td>
                <td>${lines.salesAdmin}</td>
                <td>${lines.deliveryDate}</td>
                <td>${lines.partNumber}</td>
                <td>${lines.description}</td>
                <td>${lines.qty}</td>
                <td>${lines.soldEAUSD}</td>
                <td>${lines.supplierVendor}</td>
                <td>${lines.poVendor}</td>
                <td>${lines.vendorPODate}</td>
                <td>${lines.vendorShipDate}</td>
                <td>${lines.vendorTerms}</td>
                <td>${lines.stockAloia}</td>
                <td>${lines.dateINV}</td>
                <td>${lines.customerInvoice}</td>
                <td>${lines.freightAloiaToCustomer}</td>
                <td>${lines.freightVendorToAloia}</td>
                <td>${lines.bhCost}</td>
                <td>${lines.hazmatFees}</td>
                <td>${lines.unitCostVendorUSD}</td>
                <td>${lines.totalCostUSD}</td>
                <td>${lines.costEAUSD}</td>
                <td>${lines.totalSalesSold}</td>
                <td>${lines.operationalProfitUSD}</td>
                <td>${lines.percent}</td>
                <td>${lines.paidByCustomerOn}</td>
                <td>${lines.salesCommission}</td>
                <td>${lines.commission}</td>
                <td>${lines.customerCommissionPercent}</td>
                <td>${lines.usdCommission}</td>
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