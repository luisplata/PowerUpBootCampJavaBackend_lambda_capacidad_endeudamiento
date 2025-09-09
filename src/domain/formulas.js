// Fórmulas de negocio (puras, sin dependencias externas)
function calcularCapacidadMaxima(ingresosTotales) {
  return ingresosTotales * 0.35;
}

// Fórmula de cuota de amortización
// P = monto, i = tasa mensual (ej. 0.02), n = meses
function calcularCuota(P, i, n) {
  if (i === 0) return P / n; // préstamo sin interés
  return (P * i) / (1 - Math.pow(1 + i, -n));
}

module.exports = { calcularCapacidadMaxima, calcularCuota };
