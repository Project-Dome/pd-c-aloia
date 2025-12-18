/**
 * @NApiVersion 2.1
 * @NModuleScope Public
 * @author Rogério Gonçalves Rodrigues
 */

define([], function () {

    function extractTrackHistorical(milestones) {

        // Sempre retornar STRING (TextArea amigável)
        if (!Array.isArray(milestones) || milestones.length === 0) {
            return '';
        }

        var blocks = [];

        milestones.forEach(function (stage) {

            if (!stage || !stage.key_stage || !stage.time_iso) {
                return;
            }

            // Exemplo time_iso: 2025-12-17T11:59:04-03:00
            var timeIso = String(stage.time_iso);
            var parts = timeIso.split('T');

            // ============================
            // DATE → MM/DD/YYYY
            // ============================
            var rawDate = parts[0] || ''; // YYYY-MM-DD
            var date = rawDate;

            if (rawDate && rawDate.indexOf('-') > -1) {
                var d = rawDate.split('-'); // [YYYY, MM, DD]
                if (d.length === 3) {
                    date = d[1] + '/' + d[2] + '/' + d[0];
                }
            }

            // ============================
            // HOUR → somente HH:MM
            // ============================
            var hour = '';
            if (parts[1]) {
                // 11:59:04-03:00 → 11:59
                hour = parts[1].substring(0, 5);
            }

            blocks.push(
                'Stage: ' + stage.key_stage + '\n' +
                'Date: ' + date + '\n' +
                'Hour: ' + hour
            );
        });

        // Retorna UMA STRING final (sem aspas, sem JSON)
        return blocks.join('\n\n');
    }

    return {
        extractTrackHistorical: extractTrackHistorical
    };
});