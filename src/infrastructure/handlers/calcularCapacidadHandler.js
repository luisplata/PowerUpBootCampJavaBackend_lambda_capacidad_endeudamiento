const CalcularCapacidadService = require("../../domain/useCase/CalcularCapacidadService");
const { handleError, resultado } = require("../errorHandler");
const { logInfo, logError } = require("../logging");

const service = new CalcularCapacidadService();

module.exports.calcularCapacidad = async (event) => {
  try {
    logInfo("Request recibido", { body: event.body });

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};

    const resultadoJson = service.ejecutar({
      ingresosTotales: body.ingresosTotales,
      prestamosActivos: body.prestamosActivos || [],
      nuevoPrestamo: body.nuevoPrestamo,
    });

    logInfo("Resultado calculado", resultadoJson);

    return resultado(resultadoJson);
  } catch (error) {
    logError("Error en calcularCapacidad", error);
    return handleError(error);
  }
};
