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

        var GETTRACKINFO_URL = 'https://api.17track.net/track/v2.4/gettrackinfo';
        var API_TOKEN = '619A48177643591590C8820BEB0B4AA0'; // configurar token válido da 17TRACK

        function getTrackInfo(entry) {
            try {
                if (!entry || !entry.number || !entry.carrier) {
                    log.debug({
                        title: 'getTrackInfo',
                        details: 'Parâmetros inválidos para consulta: ' + JSON.stringify(entry)
                    });
                    return {};
                }

                var payloadArray = [
                    {
                        number: entry.number,
                        carrier: entry.carrier
                    }
                ];

                var headers = {
                    'Content-Type': 'application/json',
                    '17token': API_TOKEN
                };

                var response = https.post({
                    url: GETTRACKINFO_URL,
                    body: JSON.stringify(payloadArray),
                    headers: headers
                });

                if (!response || !response.body) {
                    log.debug({
                        title: 'getTrackInfo',
                        details: 'Resposta vazia da API 17TRACK para: ' + JSON.stringify(entry)
                    });
                    return {};
                }

                var parsed;

                try {
                    parsed = JSON.parse(response.body);
                } catch (parseError) {
                    log.error({
                        title: 'getTrackInfo - erro ao fazer parse do JSON',
                        details: {
                            error: parseError,
                            body: response.body
                        }
                    });
                    return {};
                }

                return parsed;

            } catch (error) {
                log.error({
                    title: 'getTrackInfo - erro inesperado',
                    details: {
                        error: error,
                        entry: entry
                    }
                });

                return {};
            }
        }

        return {
            getTrackInfo: getTrackInfo
        };
    }
);
