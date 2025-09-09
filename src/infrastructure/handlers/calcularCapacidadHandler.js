const CalcularCapacidadService = require("../../application/CalcularCapacidadService");
const { handleError } = require("../errorHandler");
const { logInfo, logError } = require("../logging");

const service = new CalcularCapacidadService();

module.exports.calcularCapacidad = async (event) => {
  try {
    logInfo("Request recibido", { body: event.body });

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};

    const resultado = service.ejecutar({
      ingresosTotales: body.ingresosTotales,
      prestamosActivos: body.prestamosActivos || [],
      nuevoPrestamo: body.nuevoPrestamo,
    });

    logInfo("Resultado calculado", resultado);

    return {
      statusCode: 200,
      body: JSON.stringify(resultado),
    };
  } catch (error) {
    logError("Error en calcularCapacidad", error);
    return handleError(error);
  }
};
