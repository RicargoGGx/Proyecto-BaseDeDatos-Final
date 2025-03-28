const { generateReport } = require('./Utils/metrics');
const step1 = require('./step1_generateCSV');
const step2 = require('./step2_insertCSV');
const step3 = require('./step3_insert3500');

(async () => {
    try {
        console.log("=== Iniciando medición de métricas ===");
        
        // Ejecutar pasos en orden
        await step1();
        await step2();
        await step3();
        
        // Generar reporte con todas las métricas
        generateReport();
        
        console.log("=== Proceso completado exitosamente ===");
    } catch (error) {
        console.error("Error en el proceso de métricas:", error);
    }
})();