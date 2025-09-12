const CalcularCapacidadService = require("../../domain/useCase/CalcularCapacidadService");
const { sendToSqs } = require("../adapters/SqsAdapter");
const { handleError, resultado } = require("../errorHandler");
const { logInfo, logError } = require("../logging");

const service = new CalcularCapacidadService();

module.exports.calcularCapacidad = async (event) => {
  try {
    logInfo("Request recibido", { body: event.body });

    const body = typeof event.body === "string" ? JSON.parse(event.body) : event.body || {};

    let email = body.email;

    const resultadoJson = service.ejecutar({
      ingresosTotales: body.ingresosTotales,
      prestamosActivos: body.prestamosActivos || [],
      nuevoPrestamo: body.nuevoPrestamo,
    });

    logInfo("Resultado calculado", resultadoJson);

    let listadoDelPrestamo = "";
    resultadoJson.planPagos.forEach(datoUnico => {
      listadoDelPrestamo += `Cuota #${datoUnico.mes} pagarias $${datoUnico.cuota} con un interes de ${datoUnico.interes} abonarias al capital $${datoUnico.abonoCapital} para tener un saldo pendiente de ${datoUnico.saldoRestante}\n`
    });

    //enviamos a la SQS de desiciones
    await sendToSqs(email, "Resultado automatico", `El resultado de la validacion automatica es ${resultadoJson.decision} con el plan de pago \n${listadoDelPrestamo}`);

    return resultado(resultadoJson);
  } catch (error) {
    logError("Error en calcularCapacidad", error);
    return handleError(error);
  }
};
