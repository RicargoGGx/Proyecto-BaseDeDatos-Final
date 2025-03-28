const { generateReport } = require('./Utils/metrics');
const step1 = require('./step1_generateCSV');
const step2 = require('./step2_insertCSV');

(async () => {
    try {
        console.log("=== Iniciando medición de métricas ===");
        
        // Ejecutar pasos en orden
        await step1();
        await step2();
        
        // Generar reporte con todas las métricas
        generateReport();
        
        console.log("=== Proceso completado exitosamente ===");
    } catch (error) {
        console.error("Error en el proceso de métricas:", error);
    }
})();