const { generateReport } = require('./Utils/metrics');
const step1 = require('./step1_generateCSV');
const step2 = require('./step2_insertCSV');
const step3 = require('./step3_insert3500');
const step4 = require('./step4_generate100CSVs');
const step5 = require('./step5_insert100CSVs');
const step6 = require('./step6_queryAggregate');
const step7 = require('./step7_insert150kAuthors');
const step8 = require('./step8_exportTablesCSV');
const step9 = require('./step9_backupMongo');
const step10 = require('./step10_snapshotMySQL');
const step11 = require('./step11_failInsertsUserC');
const step12 = require('./step12_mongoMillion');

(async () => {
    try {
        console.log("=== Iniciando medición de métricas ===");
        
        // Ejecutar pasos en orden
        await step1();
        await step2();
        await step3();
        await step4();
        await step5();
        await step6();
        await step7();
        await step8();
        await step9();
        await step10();
        await step11();
        await step12();
        
        // Generar reporte
        generateReport();
        
        console.log("=== Proceso completado exitosamente ===");
    } catch (error) {
        console.error("Error en el proceso de métricas:", error);
        process.exit(1);
    }
})();