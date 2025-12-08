/**
 * @NApiVersion 2.1
 * @NModuleScope public
 * @author Project Dome - Rogério Gonçalves Rodrigues
 */

define(
    [
        'N/https',
        'N/log'
    ],
    function (
        https,
        log
    ) {

        const GETTRACKINFO_URL = 'https://api.17track.net/track/v2.4/gettrackinfo';
        const API_TOKEN = '619A48177643591590C8820BEB0B4AA0'; //Criar record type para armazenar valor.


        function getTrackInfo(options) {
            try {

                if (!options || !options.number) {
                    log.error({
                        title: 'getTrackInfo - Erro',
                        details: 'Tracking number não informado.'
                    });
                    return {
                        success: false,
                        message: 'Tracking number não informado.'
                    };
                }

                // CONVERSÃO CRUCIAL: carrier sempre numérico
                var carrierId = null;

                if (options.carrier !== undefined && options.carrier !== null && options.carrier !== '') {
                    carrierId = Number(options.carrier);

                    if (isNaN(carrierId)) {
                        log.error({
                            title: 'getTrackInfo - Carrier inválido (não numérico)',
                            details: options.carrier
                        });

                        return {
                            success: false,
                            message: 'Carrier inválido (não numérico): ' + options.carrier
                        };
                    }
                }

                const payload = [
                        carrierId
                            ? { number: options.number, carrier: carrierId }
                            : { number: options.number }
                    ];

                const payloadJSON = JSON.stringify(payload);

                log.debug({
                    title: 'getTrackInfo - payload enviado',
                    details: payloadJSON
                });

                const response = https.post({
                    url: GETTRACKINFO_URL,
                    headers: {
                        'Content-Type': 'application/json',
                        '17token': API_TOKEN
                    },
                    body: payloadJSON
                });

                log.debug({
                    title: 'getTrackInfo - raw response',
                    details: {
                        code: response.code,
                        body: response.body
                    }
                });

                let bodyObj = {};
                try {
                    bodyObj = response.body ? JSON.parse(response.body) : {};
                } catch (parseErr) {
                    log.error({
                        title: 'getTrackInfo - Erro JSON.parse',
                        details: { parseErr, body: response.body }
                    });

                    return {
                        success: false,
                        httpCode: response.code,
                        message: 'Erro ao converter JSON da API.',
                        raw: response.body
                    };
                }

                // API retornou erros?
                if (bodyObj?.data?.errors?.length > 0) {
                    return {
                        success: false,
                        httpCode: response.code,
                        apiError: bodyObj.data.errors,
                        raw: bodyObj
                    };
                }

                // Sucesso
                return {
                    success: true,
                    httpCode: response.code,
                    apiCode: bodyObj.code,
                    data: bodyObj.data,
                    raw: bodyObj
                };

            } catch (error) {
                log.error({
                    title: 'getTrackInfo - erro inesperado',
                    details: error
                });

                return {
                    success: false,
                    message: 'Erro inesperado ao consultar tracking.',
                    error: error
                };
            }
        }


        return {
            getTrackInfo: getTrackInfo
        }
    })