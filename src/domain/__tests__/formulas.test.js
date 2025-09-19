const { calcularCapacidadMaxima, calcularCuota } = require('../formulas');

describe('Formulas de Negocio', () => {
  describe('calcularCapacidadMaxima', () => {
    test('debe calcular correctamente la capacidad máxima (35% de ingresos)', () => {
      const ingresos = 1000000;
      const capacidadEsperada = 350000;
      
      const resultado = calcularCapacidadMaxima(ingresos);
      
      expect(resultado).toBe(capacidadEsperada);
    });

    test('debe manejar ingresos con decimales', () => {
      const ingresos = 1500000.50;
      const capacidadEsperada = 525000.175;
      
      const resultado = calcularCapacidadMaxima(ingresos);
      
      expect(resultado).toBeCloseTo(capacidadEsperada, 2);
    });

    test('debe retornar 0 para ingresos de 0', () => {
      const resultado = calcularCapacidadMaxima(0);
      expect(resultado).toBe(0);
    });

    test('debe manejar ingresos negativos', () => {
      const ingresos = -100000;
      const resultado = calcularCapacidadMaxima(ingresos);
      expect(resultado).toBe(-35000);
    });
  });

  describe('calcularCuota', () => {
    test('debe calcular correctamente la cuota con interés', () => {
      const monto = 1000000;
      const tasaMensual = 0.02; // 2% mensual
      const plazoMeses = 12;
      
      const resultado = calcularCuota(monto, tasaMensual, plazoMeses);
      
      // Fórmula: P * i / (1 - (1 + i)^-n)
      // 1000000 * 0.02 / (1 - (1.02)^-12)
      const esperado = 94559.60;
      expect(resultado).toBeCloseTo(esperado, 1);
    });

    test('debe calcular correctamente la cuota sin interés', () => {
      const monto = 1200000;
      const tasaMensual = 0;
      const plazoMeses = 12;
      
      const resultado = calcularCuota(monto, tasaMensual, plazoMeses);
      
      expect(resultado).toBe(100000); // 1200000 / 12
    });

    test('debe manejar plazos de 1 mes', () => {
      const monto = 100000;
      const tasaMensual = 0.01;
      const plazoMeses = 1;
      
      const resultado = calcularCuota(monto, tasaMensual, plazoMeses);
      
      expect(resultado).toBeCloseTo(101000, 2); // 100000 + 1000 de interés
    });

    test('debe manejar tasas muy pequeñas', () => {
      const monto = 1000000;
      const tasaMensual = 0.001; // 0.1% mensual
      const plazoMeses = 24;
      
      const resultado = calcularCuota(monto, tasaMensual, plazoMeses);
      
      expect(resultado).toBeGreaterThan(40000);
      expect(resultado).toBeLessThan(50000);
    });

    test('debe lanzar error para valores inválidos', () => {
      expect(() => calcularCuota(-1000, 0.02, 12)).not.toThrow();
      expect(() => calcularCuota(1000, -0.02, 12)).not.toThrow();
      expect(() => calcularCuota(1000, 0.02, 0)).not.toThrow();
    });
  });
});
