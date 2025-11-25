/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Project Dome - Rogério Gonçalves Rodrigues
 */
define(
    [
        'N/record',
        'N/log',
        'N/ui/message',
        'N/error',
        'N/runtime',
        'N/search',
        'N/email',
        'N/render',

        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-search.util.js',
        '../../pd_c_netsuite_tools/pd_cnt_standard/pd-cnts-record.util.js',

        '../../pd_c_netsuite_tools/pd_cnt_common/pd-cntc-common.util.js'
    ],
    function (
        record,
        log,
        message,
        error,
        runtime,
        search,
        email,
        render,

        search_util,
        record_util,

        common_util
    ) {

        // ===== Constantes / Metadados =====
        const TYPE = 'vendorpayment';
        const FIELDS = {
            entity: 'entity',
            markFieldDefault: 'custbody_pd_send_email_payment_vendor',
            vendorEmailField: 'custentity_pd_aae_emailpayment'
        };
        const DEFAULTS = {
            AUTHOR_ID: -5,
            TEMPLATE_ID: 'custemailtmpl_pd_sem_bill_payment'
        };

        /**
         * Função principal (orquestra o processo de envio)
         * @param {number|string} _idBillPayment
         * @param {Object} options
         *   options._idTemplate   {string|number}
         *   options._idAuthor     {number}
         *   options._ccListStr    {string}
         *   options._idMarkField  {string}
         * @returns {Object} {_sentToArr, _ccArr, _subjectStr, _markedBool}
         */
        function doSend(_idBillPayment, options) {
            try {
                if (!_idBillPayment) {
                    throw error.create({ name: 'MISSING_BP_ID', message: 'ID do Bill Payment ausente.' });
                }
                if (!options || typeof options !== 'object') {
                    throw error.create({ name: 'MISSING_OPTIONS', message: 'Objeto "options" ausente.' });
                }

                let _idTemplate  = options._idTemplate || DEFAULTS.TEMPLATE_ID;
                let _idAuthor    = (options._idAuthor === 0 || options._idAuthor) ? Number(options._idAuthor) : DEFAULTS.AUTHOR_ID;
                let _ccListStr   = options._ccListStr || '';
                let _idMarkField = options._idMarkField || FIELDS.markFieldDefault;

                log.debug('doSend:entrada', {
                    _idBillPayment: _idBillPayment,
                    _idTemplate: _idTemplate,
                    _idAuthor: _idAuthor,
                    _idMarkField: _idMarkField,
                    _ccListStr: _ccListStr
                });

                // 1) Obter Vendor do Bill Payment
                let _idVendor = getVendorIdFromBillPayment(_idBillPayment);
                log.debug('doSend:vendor', { _idVendor: _idVendor });

                // 2) Coletar e-mails do Vendor
                let _emailsArr = getVendorEmails(_idVendor);
                validateEmails(_emailsArr);
                log.debug('doSend:emails', _emailsArr);

                // 3) Montar CC (opcional)
                let _ccArr = buildCcArray(_ccListStr);

                // 4) Merge do template
                let _mergeObj   = mergeTemplate(_idBillPayment, _idTemplate);
                let _subjectStr = _mergeObj._subjectStr;
                let _bodyStr    = _mergeObj._bodyStr;
                let _hasBody    = !!(_bodyStr && _bodyStr.length);
                log.debug('doSend:template', { _idTemplate: _idTemplate, _subjectStr: _subjectStr, _hasBody: _hasBody });

                // 4.1) Coletar Vendor Bills aplicadas e anexar a listagem dinâmica ao corpo (se houver)
                let _appliedArr = getAppliedVendorBills(_idBillPayment);
                log.debug('doSend:appliedCount', { count: _appliedArr.length });
                if (_appliedArr.length > 0) {
                    let _appliedHtml = buildAppliedBillsHtml(_appliedArr);
                    _bodyStr = _bodyStr + _appliedHtml; // anexa seção dinâmica ao final
                }

                // 5) Envio do e-mail
                sendEmail(_idAuthor, _emailsArr, _subjectStr, _bodyStr, _idBillPayment, _ccArr);

                // 6) Marcar checkbox após sucesso
                let _markedBool = markCheckbox(_idBillPayment, _idMarkField);

                // 7) Retorno
                let _resultObj = buildResult(_emailsArr, _ccArr, _subjectStr, _markedBool);
                log.debug('doSend:resultado', _resultObj);
                return _resultObj;

            } catch (_err) {
                log.error('doSend:erro', { _idBillPayment: _idBillPayment, message: _err && _err.message, stack: _err && _err.stack });
                throw _err;
            }
        }

        // ===== Helpers =====

        function getVendorIdFromBillPayment(_idBillPayment) {
            let _lookupObj = search.lookupFields({
                type: TYPE,
                id: _idBillPayment,
                columns: [FIELDS.entity]
            });

            let _idVendor = _lookupObj && _lookupObj[FIELDS.entity] && _lookupObj[FIELDS.entity][0]
                ? Number(_lookupObj[FIELDS.entity][0].value) : null;

            if (!_idVendor) {
                throw error.create({ name: 'VENDOR_NOT_FOUND', message: 'Vendor não identificado no Bill Payment.' });
            }
            return _idVendor;
        }

        function getVendorEmails(_idVendor) {
            let _vendorLookup = search.lookupFields({
                type: search.Type.VENDOR,
                id: _idVendor,
                columns: [FIELDS.vendorEmailField]
            });

            let _raw = _vendorLookup && _vendorLookup[FIELDS.vendorEmailField] ? String(_vendorLookup[FIELDS.vendorEmailField]) : '';
            let _emailsArr = _raw
                .split(/[;,]/)
                .map(function (_e) { return (_e || '').trim(); })
                .filter(function (_e) { return !!_e; });

            return _emailsArr;
        }

        function validateEmails(_emailsArr) {
            if (!_emailsArr || !_emailsArr.length) {
                throw error.create({
                    name: 'NO_VENDOR_EMAIL',
                    message: 'Nenhum e-mail válido encontrado no Vendor (campo: ' + FIELDS.vendorEmailField + ').'
                });
            }
            return true;
        }

        function mergeTemplate(_idBillPayment, _idTemplate) {
            if (!_idTemplate) {
                throw error.create({ name: 'NO_TEMPLATE', message: 'ID do template não informado.' });
            }
            let _merge = render.mergeEmail({
                templateId: _idTemplate,
                transactionId: _idBillPayment
            });
            return {
                _subjectStr: _merge.subject || '',
                _bodyStr: _merge.body || ''
            };
        }

        /**
         * Coleta todas as Vendor Bills aplicadas ao Bill Payment (sublista "apply")
         * Retorna array de objetos com dados para renderização no e-mail.
         */
        function getAppliedVendorBills(_idBillPayment) {
            let _appliedArr = [];

            let _vendorPaymentObj = record.load({
                type: TYPE,
                id: _idBillPayment,
                isDynamic: false
            });

            let _lineCount = _vendorPaymentObj.getLineCount({ sublistId: 'apply' }) || 0;

            for (let _i = 0; _i < _lineCount; _i++) {
                let _isApplied = _vendorPaymentObj.getSublistValue({
                    sublistId: 'apply',
                    fieldId: 'apply',
                    line: _i
                });

                if (_isApplied) {
                    // Campos típicos da sublista "apply" em Vendor Payment:
                    // 'type' (ex.: 'Vendor Bill'), 'doc' (número do documento), 'applydate' ou 'trandate', 'amount'
                    let _typeStr = _vendorPaymentObj.getSublistValue({ sublistId: 'apply', fieldId: 'type', line: _i }) || '';
                    let _docNumberStr = _vendorPaymentObj.getSublistValue({ sublistId: 'apply', fieldId: 'doc', line: _i }) || '';
                    let _tranDateStr = _vendorPaymentObj.getSublistValue({ sublistId: 'apply', fieldId: 'applydate', line: _i })
                                      || _vendorPaymentObj.getSublistValue({ sublistId: 'apply', fieldId: 'trandate', line: _i }) || '';
                    let _amountNum = _vendorPaymentObj.getSublistValue({ sublistId: 'apply', fieldId: 'amount', line: _i }) || 0;

                    _appliedArr.push({
                        _typeStr: _typeStr,
                        _docNumberStr: _docNumberStr,
                        _tranDateStr: _tranDateStr,
                        _amountNum: Number(_amountNum)
                    });
                }
            }

            return _appliedArr;
        }

        /**
         * Monta HTML (sem bordas) listando as Vendor Bills aplicadas.
         * Renderiza cabeçalho + uma linha por Vendor Bill.
         */
        function buildAppliedBillsHtml(_appliedArr) {
            if (!_appliedArr || !_appliedArr.length) return '';

            let _rowsHtml = _appliedArr.map(function (_row) {
                return '' +
                    '<tr>' +
                    '<td style="padding:6px;">' + escapeHtml(_row._docNumberStr) + '</td>' +
                    '<td style="padding:6px;">' + escapeHtml(_row._tranDateStr) + '</td>' +
                    '<td style="padding:6px;">' + formatAmount(_row._amountNum) + '</td>' +
                    '</tr>';
            }).join('');

            let _html =
                '<p style="margin-top:16px;">Applied Vendor Bills:</p>' +
                '<table style="border-collapse: collapse; font-size: 14px;">' +
                '<tr>' +
                '<th style="padding:6px; text-align:left;">Bill Number</th>' +
                '<th style="padding:6px; text-align:left;">Bill Date</th>' +
                '<th style="padding:6px; text-align:left;">Applied Amount</th>' +
                '</tr>' +
                _rowsHtml +
                '</table>';

            return _html;
        }

        // Util simples para evitar HTML injection em strings
        function escapeHtml(_str) {
            if (_str === null || _str === undefined) return '';
            return String(_str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        }

        // Formatação simples de número para string (padrão en-US sem símbolo)
        function formatAmount(_num) {
            try {
                return Number(_num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            } catch (e) {
                return String(_num || 0);
            }
        }

        function sendEmail(_idAuthor, _emailsArr, _subjectStr, _bodyStr, _idBillPayment, _ccArr) {
            email.send({
                author: Number(_idAuthor),
                recipients: _emailsArr, // todos no TO
                subject: _subjectStr,
                body: _bodyStr,
                relatedRecords: { transactionId: _idBillPayment },
                cc: (_ccArr && _ccArr.length) ? _ccArr : null
            });
        }

        function markCheckbox(_idBillPayment, _idField) {
            let _valuesObj = {};
            _valuesObj[_idField] = true;

            record.submitFields({
                type: TYPE,
                id: _idBillPayment,
                values: _valuesObj,
                options: { enableSourcing: false, ignoreMandatoryFields: true }
            });
            return true;
        }

        function buildCcArray(_ccListStr) {
            if (!_ccListStr) return [];
            return _ccListStr
                .split(/[;,]/)
                .map(function (_e) { return (_e || '').trim(); })
                .filter(function (_e) { return !!_e; });
        }

        function buildResult(_sentToArr, _ccArr, _subjectStr, _markedBool) {
            return {
                _sentToArr: _sentToArr || [],
                _ccArr: _ccArr || [],
                _subjectStr: _subjectStr || '',
                _markedBool: !!_markedBool
            };
        }

        // API pública
        return {
            doSend: doSend
        };
    }
);
