const { calcularCapacidadMaxima, calcularCuota } = require("../domain/formulas");

class CalcularCapacidadService {
  ejecutar({ ingresosTotales, prestamosActivos, nuevoPrestamo }) {
    // 1. Capacidad máxima
    const capacidadMaxima = calcularCapacidadMaxima(ingresosTotales);

    // 2. Deuda mensual actual
    const deudaMensualActual = prestamosActivos
      .map(p => calcularCuota(p.monto, p.tasaMensual, p.plazoMeses))
      .reduce((a, b) => a + b, 0);

    // 3. Capacidad disponible
    const capacidadDisponible = capacidadMaxima - deudaMensualActual;

    // 4. Cuota del nuevo préstamo
    const cuotaNuevoPrestamo = calcularCuota(
      nuevoPrestamo.monto,
      nuevoPrestamo.tasaMensual,
      nuevoPrestamo.plazoMeses
    );

    // 5. Decisión
    let decision = "RECHAZADO";
    if (cuotaNuevoPrestamo <= capacidadDisponible) {
      decision = "APROBADO";
      if (nuevoPrestamo.monto > ingresosTotales * 5) {
        decision = "REVISION MANUAL";
      }
    }

    // 6. Plan de pagos (detalle de cuotas)
    const planPagos = [];
    let saldo = nuevoPrestamo.monto;
    for (let mes = 1; mes <= nuevoPrestamo.plazoMeses; mes++) {
      const interes = saldo * nuevoPrestamo.tasaMensual;
      const abonoCapital = cuotaNuevoPrestamo - interes;
      saldo -= abonoCapital;
      planPagos.push({
        mes,
        cuota: cuotaNuevoPrestamo.toFixed(2),
        interes: interes.toFixed(2),
        abonoCapital: abonoCapital.toFixed(2),
        saldoRestante: saldo.toFixed(2),
      });
    }

    return {
      capacidadMaxima,
      deudaMensualActual,
      capacidadDisponible,
      cuotaNuevoPrestamo,
      decision,
      planPagos,
    };
  }
}

module.exports = CalcularCapacidadService;
