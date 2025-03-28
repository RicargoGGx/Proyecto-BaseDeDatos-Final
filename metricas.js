const { generateReport } = require('./Utils/metrics');
const step1 = require('./step1_generateCSV');

(async () => {
    try {
        console.log("=== Iniciando medición de métricas ===");
        
        // Ejecutar paso 1
        await step1();
        
        // Generar reporte
        generateReport();
        
        console.log("=== Proceso completado exitosamente ===");
    } catch (error) {
        console.error("Error en el proceso de métricas:", error);
    }
})();