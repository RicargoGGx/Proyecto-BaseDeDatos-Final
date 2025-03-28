const fs = require('fs');
const path = require('path');
const { generate_csv, setBookCounter } = require('./Utils/generador_aleatorio');
const { saveMetric } = require('./Utils/metrics');

setBookCounter(1);

module.exports = async () => {
    try {
        console.log("[STEP 1] Generando CSV de 100,000 libros...");
        
        // Crear directorio si no existe
        const csvFolder = path.join(__dirname, 'csv');
        if (!fs.existsSync(csvFolder)) {
            fs.mkdirSync(csvFolder);
        }

        // Medir tiempo de ejecución
        const startTime = Date.now();
        const csvData = generate_csv(100000);
        const filePath = path.join(csvFolder, "libros_100k.csv");
        fs.writeFileSync(filePath, csvData);
        const endTime = Date.now();
        const executionTime = endTime - startTime;

        // Mostrar resultados
        console.log(`[STEP 1] CSV generado en: ${filePath}`);
        console.log(`[STEP 1] Tiempo total: ${executionTime} ms`);

        // Guardar métrica
        saveMetric('step1', 'generate_csv', executionTime);
        
        return executionTime;
    } catch (error) {
        console.error("Error en step1_generateCSV:", error);
        throw error;
    }
};