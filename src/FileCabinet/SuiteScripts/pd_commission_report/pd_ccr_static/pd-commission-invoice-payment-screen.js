const RESTLET = {
    script: 'customscript_pd_ccr_comission_paymt_rt',   // ID real do Restlet
    deployment: 'customdeploy_pd_ccr_comission_paymt_rt'
};

$(document).ready(function () {
    loadCommissionData();
});

function loadCommissionData() {
    post({
        restlet: RESTLET,
        onSuccess: function (response) {
            if (response.success && response.data && response.data.length) {
                renderCommissionTable(response.data);
            } else {
                renderNoResults();
                console.warn('No data returned by Restlet', response);
            }
        },
        onError: function (err) {
            console.error('Error calling Restlet', err);
            renderNoResults();
        }
    });
}

function renderCommissionTable(data) {
    window.commissionData = data; // salva globalmente
    var _listBody = $('#commission-table');

    var vendorGroups = {};
    data.forEach((item, originalIndex) => {
        var vendorKey = item.vendorEmployee || 'no-vendor';
        if (!vendorGroups[vendorKey]) {
            vendorGroups[vendorKey] = {
                total: null,
                items: []
            };
        }

        let newItem = { ...item, originalIndex: originalIndex };

        if (item.isTotal || vendorGroups[vendorKey].total === null) {
            vendorGroups[vendorKey].total = newItem;
        } else {
            vendorGroups[vendorKey].items.push(newItem);
        }
    });

    var vendorKeys = Object.keys(vendorGroups);

    var html = `
        <table class="table table-striped table-bordered align-middle">
            <thead class="table-dark text-center">
                <tr>
                    <td></td>
                    <td>Select</td>
                    <td>Vendor Employee</td>
                    <td>Total Commission Value</td>
                </tr>
            </thead>
            <tbody>
    `;

    vendorKeys.forEach((vendorKey, vendorIndex) => {
        var vendorGroup = vendorGroups[vendorKey];
        var vendorTotal = vendorGroup.total;
        var vendorItems = vendorGroup.items;

        html += `
            <tr>
                <td>
                    ${vendorItems.length > 0 ?
                `<button class="btn btn-light btn-sm" href="#vendor-container${vendorIndex}" 
                            data-toggle="collapse" role="button" aria-expanded="false" 
                            aria-controls="vendor-container${vendorIndex}"> 
                            <i class="fa fa-sort" style="font-size:13px"></i>
                        </button>`
                : ''
            }
                </td>
                <td class="text-center">
                    <input type="checkbox" class="approve-check group-check" 
                        data-vendor-index="${vendorIndex}" 
                        value="${vendorTotal?.originalIndex ?? ''}" />
                </td>
                <td>${vendorKey}</td>
                <td>${Number(ifNullOrEmpty(vendorTotal?.amountValue, 0)).format()}</td>
            </tr>
        `;

        vendorItems.forEach((item, itemIndex) => {
            html += `
                <tr class="collapse" id="vendor-container${vendorIndex}">
                    <td></td>
                    <td></td>
                    <td>${item.vendorEmployee}</td>
                    <td>${Number(ifNullOrEmpty(item.amountValue, 0)).format()}</td>
                </tr>
            `;
        });
    });

    html += '</tbody></table>';
    _listBody.html(html);
}


function getSelectedRTs() {
    let selected = [];
    $('.approve-check:checked').each(function () {
        selected.push(parseInt($(this).val()));
    });
    return selected;
}

function createCommissionInvoice() {
    const selectedIndexes = getSelectedRTs();
    const dueDate = $('#due-date').val();

    if (!selectedIndexes.length) {
        alert('Select at least one record to create the invoice.');
        return;
    }
    if (!dueDate) {
        alert('Please provide the Commission Invoice Due Date.');
        return;
    }

    // Obtemos os registros selecionados do array original
    const selectedRecords = selectedIndexes.map(i => window.commissionData[i]);
    console.log('Selected Records:', selectedRecords);
    console.log('Expiration Due Date:', dueDate);

    alert('Create invoice function will be implemented in the next step.');
}

function ifNullOrEmpty(value, defaultValue) {
    return (value === null || value === undefined || value === '') ? defaultValue : value;
}
// Guardamos os dados em variável global para acessar os selecionados
// function renderCommissionTable(data) {
//     window.commissionData = data; // salva globalmente
//     var _listBody = $('#commission-table');

//     var html = `
//         <table class="table table-striped table-bordered align-middle">
//             <thead class="table-dark text-center">
//                 <tr>
//                     <td>Select</td>
//                     <td>Vendor Employee</td>
//                     <td>Total Commission Value</td>
//                 </tr>
//             </thead>
//             <tbody>
//     `;

//     data.forEach(function (item, index) {
//         html += `
//             <tr>
//                 <td class="text-center">
//                     <input type="checkbox" class="approve-check" value="${index}" />
//                 </td>
//                 <td>${item.vendorEmployee}</td>
//                 <td>${item.amountValue.toFixed(2)}</td>
//             </tr>
//         `;
//     });

//     html += '</tbody></table>';
//     _listBody.html(html);
// }