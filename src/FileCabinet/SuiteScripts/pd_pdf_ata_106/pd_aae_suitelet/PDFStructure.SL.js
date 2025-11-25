/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @Author Lucas Monaco - Project Dome
 */
define(
    [
        'N/record',
        'N/log',
        'N/render',
        'N/format',
        'N/file',
        'N/runtime',
        'N/search',
    ],
    function (
        record,
        log,
        render,
        format,
        file,
        runtime,
        search
    ) {
        function getImageUrl(fileId) {
            try {
                var fileObj = file.load({
                    id: fileId
                });
                var url = fileObj.url;
                url = url.replace(/&/g, '&amp;');
                return url;
            } catch (e) {
                log.error('Erro ao carregar arquivo', e);
                return '';
            }
        }
        function onRequest(context) {
            if (context.request.method === 'GET') {
                const invoiceId = context.request.parameters.invoiceId;
                try {
                    const invoice = record.load({
                        type: record.Type.INVOICE,
                        id: invoiceId,
                        isDynamic: true
                    });

                    const userId = runtime.getCurrentUser().id;
                    const employeeSig = record.load({
                        type: record.Type.EMPLOYEE,
                        id: userId
                    });
                    const signatureFileId = employeeSig.getValue({ fieldId: 'custentity_pd_aae_signature' });
                    const signatureUrl = signatureFileId ? getImageUrl(signatureFileId) : '';
                    const sellerContract = invoice.getValue({ fieldId: 'tranid' }) || '';
                    const codPo = invoice.getValue({ fieldId: 'otherrefnum' }) || '';
                    const rawDate = invoice.getValue({ fieldId: 'trandate' });
                    const date = rawDate ? format.format({ value: rawDate, type: format.Type.DATE }) : '';
                    const customer = invoice.getText({ fieldId: 'entity' }) || '';
                    const itemName = invoice.getSublistText({ sublistId: 'item', fieldId: 'item', line: 0 }) || '';


                    const itemAccount = invoice.getLineCount({
                        sublistId: 'item'
                    }) //2

                    const mapLine = { inventorynumber: [] };
                    // const mapInventoryNumber = { inventorynumber: [] };
                    if (itemAccount === 0) return;
                    for (var lineTransactionItemIndex = 0; lineTransactionItemIndex < itemAccount; lineTransactionItemIndex++) {

                        var _line = invoice.selectLine({
                            sublistId: 'item',
                            line: lineTransactionItemIndex
                        });

                        log.debug('_line', _line);

                        const manufacturerId = invoice.getCurrentSublistValue({ sublistId: 'item', fieldId: 'custcol_pd_aae_manufacturer', line: lineTransactionItemIndex }) || '';
                        const statusMaterial = invoice.getCurrentSublistText({ sublistId: 'item', fieldId: 'custcol_pd_aae_status_item', line: lineTransactionItemIndex }) || '';
                        const description = invoice.getCurrentSublistValue({ sublistId: 'item', fieldId: 'description', line: lineTransactionItemIndex }) || '';
                        const quantity = invoice.getCurrentSublistValue({ sublistId: 'item', fieldId: 'quantity', line: lineTransactionItemIndex }) || '';


                        var objSubRecord = invoice.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail',
                            line: lineTransactionItemIndex
                        });

                        log.debug('objSubRecord', objSubRecord);

                        const itemSubRecordAccount = objSubRecord.getLineCount({
                            sublistId: 'inventoryassignment'
                        })

                        for (var lineSubRecordIndex = 0; lineSubRecordIndex < itemSubRecordAccount; lineSubRecordIndex++) {
                            var _line = objSubRecord.selectLine({
                                sublistId: 'inventoryassignment',
                                line: lineSubRecordIndex
                            });

                            var inventoryNumberLine = objSubRecord.getCurrentSublistValue({
                                sublistId: 'inventoryassignment', fieldId: 'issueinventorynumber',
                            });

                            var serialNumber = search.lookupFields({
                                type: record.Type.INVENTORY_NUMBER,
                                id: inventoryNumberLine,
                                columns: ['inventorynumber']
                            })

                            log.debug('serialNumber', serialNumber);

                            mapLine['inventorynumber'].push({
                                inventorynumber: serialNumber.inventorynumber
                            })
                        }

                        if (mapLine[lineSubRecordIndex])
                            mapLine[lineSubRecordIndex].push({
                                manufacturerId: manufacturerId,
                                statusMaterial: statusMaterial,
                                description: description,
                                quantity: quantity
                            });
                        else {
                            mapLine[lineSubRecordIndex] = [];
                            mapLine[lineSubRecordIndex].push({
                                manufacturerId: manufacturerId,
                                statusMaterial: statusMaterial,
                                description: description,
                                quantity: quantity
                            });
                        }
                    }
                    var serialNumberText = mapLine.inventorynumber
                        .map(function (obj) { return obj.inventorynumber; })
                        .join(", ");

                    log.debug('mapLine', mapLine);

                    const descriptionQuebrada = description.replace(/(?:\r\n|\r|\n)/g, '<br/>');
                    const subsidiary = invoice.getText({ fieldId: 'subsidiary' }) || '';
                    const subsidiaryId = invoice.getValue({ fieldId: 'subsidiary' }) || '';
                    var subsidiaryAddress = '';
                    const createdFromId = invoice.getValue({ fieldId: 'createdfrom' }) || '';
                    var remarks = invoice.getValue({ fieldId: 'custbody_pd_remarks' }) || '';
                    var lastCertificatedAgency = invoice.getValue({ fieldId: 'custbody_pd_lastcerifiedagency' }) || '';
                    var ack = '';
                    var manufacturerName = '';
                    const firstName = employeeSig.getValue({ fieldId: 'firstname' }) || '';
                    const middleName = employeeSig.getValue({ fieldId: 'middlename' }) || '';
                    const lastName = employeeSig.getValue({ fieldId: 'lastname' }) || '';
                    const employeeName = (firstName + ' ' + middleName + ' ' + lastName).replace(/\s+/g, ' ').trim();
                    log.debug('Status Material', statusMaterial);


                    const showPart15 = (statusMaterial === 'Open');
                    const showPart19 = !showPart15;

                    const trPartsNameDate = (!signatureUrl || !showPart15)
                        ? "<tr style=\"background-color: #d3d3d3; padding: 0;\">"
                        : "<tr style=\" padding: 0;\">";

                    const trPartsNameDate2 = (!signatureUrl || !showPart19)
                        ? "<tr style=\"background-color: #d3d3d3; padding: 0;\">"
                        : "<tr style=\" padding: 0;\">";

                    const tdPartsNameDate = (!signatureUrl || !showPart15)
                        ? "<td colspan=\"1\" style=\"border: 1px solid black; padding: 0;background-color: #d3d3d3;\">"
                        : "<td colspan=\"1\" style=\"border: 1px solid black; padding: 0;\">";


                    const tdPartsNameDate2 = (!signatureUrl || !showPart19)
                        ? "<td colspan=\"1\" style=\"border: 1px solid black; padding: 0;background-color: #d3d3d3;\">"
                        : "<td colspan=\"1\" style=\"border: 1px solid black; padding: 0;\">";

                    const correctSideName = showPart15 && signatureUrl
                        ? "<td style=\"border: none; padding: 4px; width: 56%;\">16. Name: <br/>" + employeeName + "</td>"
                        : "<td style=\"border: none; padding: 4px; width: 56%;\">16. Name: <br/></td>";

                    const correctSideDate = showPart15 && signatureUrl
                        ? "<td style=\"border: none; padding: 4px; width: 40%; text-align: right;\">17. Date: " + date + "</td>"
                        : "<td style=\"border: none; padding: 4px; width: 40%; text-align: right;\">17. Date: </td>";

                    const correctSideName2 = showPart19 && signatureUrl
                        ? "<td style=\"border: none; padding: 4px; width: 56%;\">20. Name: <br/>" + employeeName + "</td>"
                        : "<td style=\"border: none; padding: 4px; width: 56%;\">20. Name: <br/></td>";

                    const correctSideDate2 = showPart19 && signatureUrl
                        ? "<td style=\"border: none; padding: 4px; width: 40%; text-align: right;\">21. Date: " + date + "</td>"
                        : "<td style=\"border: none; padding: 4px; width: 40%; text-align: right;\">21. Date: </td>";


                    const tdNoSignature = (!signatureUrl || !showPart15)
                        ? "<td colspan=\"1\" style=\" background-color: #d3d3d3; border: 1px solid black; padding: 0; vertical-align: top;\">"
                        : "<td colspan=\"1\" style=\"border: 1px solid black; padding: 0; vertical-align: top;\">";

                    const tdNoSignatureUsed = (!signatureUrl || !showPart19)
                        ? "<td colspan=\"1\" style=\" background-color: #d3d3d3; border: 1px solid black; padding: 0; vertical-align: top;\">"
                        : "<td colspan=\"1\" style=\"border: 1px solid black; padding: 0; vertical-align: top;\">";

                    const noSignature = "<div style='background-color:#d3d3d3; width: 100%; height: 30px; padding: 0; margin: 0; border: none;'>&nbsp;</div>";

                    const newPartsSignature = showPart15 && signatureUrl
                        ? '<img src="' + signatureUrl + '" style="width: 200px; height: 40px; object-fit: contain; margin-top: 4px;"/>'
                        : noSignature;


                    const usedPartsSignature = showPart19 && signatureUrl
                        ? '<img src="' + signatureUrl + '" style="width: 200px; height: 40px; margin-top: 4px;"/>'
                        : noSignature;


                    if (subsidiaryId) {
                        const subsidiaryRec = record.load({
                            type: record.Type.SUBSIDIARY,
                            id: subsidiaryId
                        });
                        subsidiaryAddress = subsidiaryRec.getValue({ fieldId: 'mainaddress_text' }) || '';
                    }

                    if (manufacturerId) {
                        const manufacturerRec = record.load({
                            type: record.Type.VENDOR,
                            id: manufacturerId
                        });
                        manufacturerName = manufacturerRec.getValue({ fieldId: 'companyname' }) || '';
                    }

                    if (createdFromId) {
                        const salesOrder = record.load({
                            type: record.Type.SALES_ORDER,
                            id: createdFromId
                        });

                        ack = salesOrder.getValue({ fieldId: 'transactionnumber' }) || '';
                    }

                    log.debug('ack', ack);

                    var pdfContent = "<?xml version=\"1.0\"?>" +
                        "<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">" +
                        "<pdf>" +
                        "<head>" +
                        "   <style type=\"text/css\">" +
                        "     body { font-family: Arial, sans-serif; font-size: 10pt; margin: 20px; }" +
                        "     table { width: 100%; border-collapse: collapse; margin-bottom: 5px; }" +
                        "     td { border: 1px solid #000; padding: 4px; vertical-align: top; font-size: 9pt; }" +
                        "     .header-container { display: flex; justify-content: space-between; align-items: center; border: 1px solid #000; margin-bottom: 5px; }" +
                        "     .title-header { font-weight: bold; text-align: center; font-size: 12pt; border-right: none; flex-grow: 1; border:none; margin-left: 150px;  padding-top: 12px; }" +
                        "     .small-header { text-align: right; font-size: 9pt; border-left: none; white-space: nowrap; border:none; padding-top: 14px; }" +
                        "     .with-bold { font-weight: bold; font-size: 8pt; }" +
                        "     .seller-info-table { font-size: 8pt; }" +
                        "     .section-label { width: 50%; text-align: center; vertical-align: middle; }" +
                        "     .section-label-span { font-weight: bold; font-size: 12pt; display: block; margin-top: 5px; margin-left: 150px; }" +
                        "     .section-label-spans { font-weight: bold; font-size: 12pt; display: block; margin-top: 5px; margin-left: 70px; }" +
                        "     .field-label { font-size: 8pt; }" +
                        "     .field-label-others { font-size: 8pt; margin-left: 10px; }" +
                        "     .field-span-others { font-size: 8pt;  }" +
                        "     .address-text { font-size: 9pt; margin-left: 10px; display: inline-block; }" +
                        "     .data-row { height: 163px; }" +
                        "     .data-row-remarks { height: 60px; }" +
                        "     .small-header-remarks { font-size: 8pt; font-weight: normal; }" +
                        "     .verification-row { height: 80px; }" +
                        "     .signature-row { height: 60px; }" +
                        "     .signature-name-row { height: 40px; }" +
                        "     .no-right-border { border-right: none !important; }" +
                        "     .no-left-border { border-left: none !important; }" +
                        "     .no-bottom-border { border-bottom: none !important; }" +
                        "     .no-top-border { border-top: none !important; }" +
                        "     .table-header { text-align: center; font-size: 8pt; }" +
                        "     .center-cell { text-align: center; }" +
                        "     .signature-section { margin-top: 0px; }" +
                        "     .notice { font-size: 7pt; margin-top: 15px; text-align: justify; }" +
                        "     .contact-info { font-size: 8pt; }" +
                        "     .signature-cell { vertical-align: middle; }" +
                        "   </style>" +
                        "</head>" +
                        "<body>" +
                        "   <div class=\"header-container\">" +
                        "       <table>" +
                        "       <tr>" +
                        "           <td class=\"title-header\" style=\"width: 60%;\">PART OR MATERIAL CERTIFICATION FORM</td>" +
                        "           <td class=\"small-header\" style=\"width: 25%;\">ATA SPECIFICATION 106</td>" +
                        "       </tr>" +
                        "       </table>" +
                        "   </div>" +
                        "" +
                        "   " +
                        "<table>" +
                        "   <tr>" +
                        "     <td class=\"section-label\" colspan=\"2\" style=\"width: 70%;\">" +
                        "       <span class=\"seller-info-table\">2. Seller's Name:</span><br/>" +
                        "       <span class=\"section-label-span\">Aloia Aerospace Inc.</span>" +
                        "     </td>" +
                        "     <td class=\"section-label\" style=\"width: 30%;\">" +
                        "       <span class=\"seller-info-table\">3. Reference #:</span><br/>" +
                        "       <span class=\"section-label-spans\">" + sellerContract + "</span>" +
                        "     </td>" +
                        "   </tr>" +
                        "</table>" +
                        "   " +
                        "   <table>" +
                        "     <tr>" +
                        "       <td class=\"field-label-other\" style=\"width: 50%;\"><span class=\"field-span-others\">4. Organization:</span><br/><span class=\"address-text\">" + subsidiary + "</span><br/><br/><span class=\"field-span-others\">Address:</span><br/><span class=\"address-text\">" + subsidiaryAddress.replace(/\n/g, '<br/>') + "</span><br/><span class=\"address-text\">Ph: 786-213-5814,</span><br/><span class=\"address-text\">sales@aloiaaerospace.com</span></td>" +
                        "       <td class=\"field-label-other\" style=\"width: 50%;\"><span class=\"field-span-others\">Phone#:</span> 786-213-5814<br/><br/><span class=\"field-span-others\">Fax#:</span><br/><br/><span class=\"field-span-others\">SITA/Wire Code:</span><br/><br/><span class=\"field-span-others\">Status:</span></td>" +
                        "     </tr>" +
                        "     <tr>" +
                        "       <td class=\"field-label-other\"><span class=\"field-span-others\">5A. Seller's Contract #:</span> " + ack + "</td>" +
                        "       <td class=\"field-label-other\"><span class=\"field-span-others\">5B. Buyer's PO #:</span> " + codPo + "</td>" +
                        "     </tr>" +
                        "   </table>" +
                        "" +
                        "   " +
                        "   <table>" +
                        "     <tr>" +
                        "       <td class=\"table-header\" style=\"width: 8%;\">6.Item</td>" +
                        "       <td class=\"table-header\" style=\"width: 25%;\">7. Description</td>" +
                        "       <td class=\"table-header\" style=\"width: 25%;\">8. Manufacturer &amp; Part Number</td>" +
                        "       <td class=\"table-header\" style=\"width: 8%;\">10.Qty</td>" +
                        "       <td class=\"table-header\" style=\"width: 12%;\">11. Serial/Batch #</td>" +
                        "       <td class=\"table-header\" style=\"width: 12%;\">12.Status</td>" +
                        "     </tr>" +
                        "     <tr class=\"data-row\">" +
                        "       <td class=\"center-cell\">1</td>" +
                        "       <td>" + descriptionQuebrada + "</td>" +
                        "       <td>" + manufacturerName + "</td>" +
                        "       <td class=\"center-cell\">" + quantity + "</td>" +
                        "       <td class=\"center-cell\">" + serialNumberText + "</td>" +
                        "       <td class=\"center-cell\">" + statusMaterial + "</td>" +
                        "     </tr>" +
                        "   </table>" +
                        "" +
                        "   " +
                        "   <table>" +
                        "     <tr class=\"data-row-remarks\">" +
                        "       <td class=\"small-header-remarks\" style=\"width: 100%;\" colspan=\"2\">13A. Remarks: " + remarks + "</td>" +
                        "     </tr>" +
                        "     <tr>" +
                        "       <td class=\"small-header-remarks\" style=\"width: 50%;\">13B. Obtained From:<br/><br/><span class=\"with-bold\">AVIALL</span></td>" +
                        "       <td class=\"small-header-remarks\" style=\"width: 50%;\">13C. Last Certificated Agency:<br/><br/>" + lastCertificatedAgency + "</td>" +
                        "     </tr>" +
                        "   </table>" +
                        "" +
                        "   " +
                        "   <table>" +
                        "     <tr class=\"verification-row\">" +
                        "       <td class=\"field-label\" style=\"width: 44%;\">14. New Parts/Material Verification:<br/><br/>THE FOLLOWING SIGNATURE ATTESTS THAT THE PART(S) OR MATERIAL(S) IDENTIFIED ABOVE WAS (WERE) MANUFACTURED BY A FAA PRODUCTION APPROVAL HOLDER (PAH), OR TO AN INDUSTRY COMMERCIAL STANDARD.</td>" +
                        "       <td class=\"field-label\" style=\"width: 56%;\">18. Used, Repaired, Overhauled or New Surplus Parts Verification:<br/><br/>THE FOLLOWING SIGNATURE ATTESTS THAT THE DOCUMENTATION SPECIFIED ABOVE OR ATTACHED IS ACCURATE WITH REGARD TO THE ITEM(S) DESCRIBED.</td>" +
                        "     </tr>" +
                        "   </table>" +
                        "" +
                        "   " +

                        "   <table style=\"border-collapse: collapse;\">" +
                        "     <tr>" +
                        tdNoSignature +
                        "         <table style=\"border-collapse: collapse; width: 100%;\">" +
                        "           <tr>" +
                        "             <td style=\"border: none; padding: 4px; width: 50%;\">" +
                        "               15. Signature:<br/>"
                        + newPartsSignature +
                        "             </td>" +
                        "           </tr>" +
                        "         </table>" +
                        "       </td>" +
                        tdNoSignatureUsed +
                        "         <table style=\"border-collapse: collapse; width: 100%;\">" +
                        "           <tr>" +
                        "             <td style=\"border: none; padding: 4px; width: 50%;\">" +
                        "               19. Signature:<br/>"
                        + usedPartsSignature +
                        "             </td>" +
                        "           </tr>" +
                        "         </table>" +
                        "       </td>" +
                        "     </tr>" +
                        "   </table>" +
                        "" +

                        "<table style=\"border-collapse: collapse;\">" +
                        "   <tr>" +
                        tdPartsNameDate +
                        "           <table style=\"border-collapse: collapse; width: 100%;\">" +
                        trPartsNameDate +
                        correctSideName +
                        correctSideDate +
                        "               </tr>" +
                        "           </table>" +
                        "       </td>" +
                        tdPartsNameDate2 +
                        "           <table style=\"border-collapse: collapse; width: 100%;\">" +
                        trPartsNameDate2 +
                        correctSideName2 +
                        correctSideDate2 +
                        "               </tr>" +
                        "           </table>" +
                        "       </td>" +
                        "   </tr>" +
                        "</table>" +

                        "" +
                        "   <div class=\"notice\">" +
                        "     <strong>NOTICE:</strong> The above signature binds the seller and the SIGNER to the accuracy of the information provided in the FORM. Should the information provided in this Form contain inaccuracies or misrepresentations, the signer and SELLER may be liable for damages and be subject to criminal prosecution under state and federal law." +
                        "   </div>" +
                        "" +
                        "</body>" +
                        "</pdf>";


                    var pdfFile = render.xmlToPdf({ xmlString: pdfContent });

                    context.response.setHeader({
                        name: 'Content-Type',
                        value: 'application/pdf'
                    });

                    context.response.writeFile(pdfFile, true);

                } catch (e) {
                    log.error('Erro ao gerar PDF', e);
                    context.response.write('Erro: ' + e.message);
                }
            }
        }

        return {
            onRequest: onRequest
        };
    });