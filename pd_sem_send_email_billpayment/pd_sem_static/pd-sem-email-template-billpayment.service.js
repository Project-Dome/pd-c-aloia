/**
 * @NApiVersion 2.x
 * @NModuleScope public 
 * @author Project Dome - Rogério Gonçalves Rodrigues
 */
define(
    [
        'N/log',
        'N/xml',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'

    ],
    function (
        log,
        xml
    ) {

        function templateXML(data) {

            return ['<?xml version="1.0"?>',
                '<p>Dear ' + ${ vendor.companyName } + ',</p>',
                '<p>We inform you that the payment has been made according to the details below:&nbsp; &nbsp; &nbsp;</p>',
                '<table style="border-collapse: collapse; font-size: 14px;">',
                '<tbody>',
                '< tr >',
                '<th style="padding: 6px; text-align: left;">Payment Number</th>',
                '<th style="padding: 6px; text-align: left;">Payment Date</th>',
                '<th style="padding: 6px; text-align: left;">Total Amount Paid</th>',
                '</tr >',
                '<tr>',
                '<td style="padding: 6px;">' + ${ transaction.tranid } + '</td>',
                '<td style="padding: 6px;">' + ${ transaction.trandate } + '</td>',
                '<td style="padding: 6px;">R$ ' + ${ transaction.amount } + '</td>',
                '</tr >',
                '</tbody >',
                '</table >',
                '<p>This payment refers to financial obligations previously agreed with your company.</p>',
                '<p>If you find any discrepancy, we kindly ask you to contact us.</p>',
                '<p>Sincerely,<br />' + ${ preferences.user.name } + '<br />Finance Department</p>',

            ].join(' ');

        }

        function buildItem(itemList) { }

        return {
            templateXML: templateXML
        }
    }
)