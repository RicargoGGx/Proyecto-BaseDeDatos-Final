const fs = require('fs');
const path = require('path');

const metricsFile = path.join(__dirname, '../metrics.json');

// Inicializar o cargar métricas
function initMetrics() {
    if (!fs.existsSync(metricsFile)) {
        fs.writeFileSync(metricsFile, JSON.stringify({ steps: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
}

// Guardar métricas de forma segura
function saveMetric(stepName, operation, time) {
    try {
        const metrics = initMetrics();
        
        if (!metrics.steps) metrics.steps = {};
        if (!metrics.steps[stepName]) metrics.steps[stepName] = {};
        
        metrics.steps[stepName][operation] = time;
        
        fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));
        return true;
    } catch (error) {
        console.error('Error al guardar métricas:', error);
        return false;
    }
}

// Generar reporte HTML
function generateReport() {
    try {
        const metrics = initMetrics();
        
        // Validar que existan métricas
        if (!metrics.steps || Object.keys(metrics.steps).length === 0) {
            console.log('No hay métricas para generar reporte');
            return;
        }

        // Preparar datos para el gráfico
        const labels = [];
        const data = [];
        const backgroundColors = [];
        const colors = [
            'rgba(255, 99, 132, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(153, 102, 255, 0.7)'
        ];

        let colorIndex = 0;
        
        // Procesar métricas
        for (const [stepName, operations] of Object.entries(metrics.steps)) {
            for (const [opName, time] of Object.entries(operations)) {
                labels.push(`${stepName} - ${opName}`);
                data.push(time);
                backgroundColors.push(colors[colorIndex % colors.length]);
                colorIndex++;
            }
        }

        // Generar HTML del reporte
        const reportHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Reporte de Métricas</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .chart-container { width: 90%; max-width: 800px; margin: 30px auto; }
                h1 { color: #333; text-align: center; }
                .metric-list { 
                    background: #f5f5f5; 
                    padding: 15px; 
                    border-radius: 5px; 
                    margin: 20px auto;
                    max-width: 800px;
                }
                li { margin: 5px 0; }
            </style>
        </head>
        <body>
            <h1>Reporte de Métricas de Ejecución</h1>
            
            <div class="metric-list">
                <h2>Resumen de Tiempos</h2>
                <ul>
                    ${labels.map((label, index) => 
                        `<li><strong>${label}:</strong> ${data[index]} ms</li>`
                    ).join('')}
                </ul>
            </div>
            
            <div class="chart-container">
                <canvas id="metricsChart"></canvas>
            </div>

            <script>
                const ctx = document.getElementById('metricsChart');
                new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: ${JSON.stringify(labels)},
                        datasets: [{
                            label: 'Tiempo de ejecución (ms)',
                            data: ${JSON.stringify(data)},
                            backgroundColor: ${JSON.stringify(backgroundColors)},
                            borderWidth: 1
                        }]
                    },
                    options: {
                        responsive: true,
                        scales: {
                            y: {
                                beginAtZero: true,
                                title: {
                                    display: true,
                                    text: 'Tiempo (ms)'
                                }
                            }
                        }
                    }
                });
            </script>
        </body>
        </html>
        `;

        // Guardar reporte
        fs.writeFileSync(path.join(__dirname, '../reporte.html'), reportHTML);
        console.log('✔ Reporte generado exitosamente en reporte.html');
        
    } catch (error) {
        console.error('Error al generar reporte:', error);
    }
}

module.exports = {
    saveMetric,
    generateReport
};