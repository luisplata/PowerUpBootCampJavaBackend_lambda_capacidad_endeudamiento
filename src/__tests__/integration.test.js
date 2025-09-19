const { calcularCapacidad } = require('../infrastructure/handlers/calcularCapacidadHandler');

// Mock de las dependencias externas para pruebas de integración
jest.mock('../infrastructure/adapters/SqsAdapter', () => ({
  sendToSqs: jest.fn().mockResolvedValue({ MessageId: 'integration-test-id' }),
  sendToSqsReport: jest.fn().mockResolvedValue({ MessageId: 'integration-report-id' })
}));

jest.mock('../infrastructure/logging', () => ({
  logInfo: jest.fn(),
  logError: jest.fn()
}));

describe('Integration Tests - calcularCapacidad', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('debe procesar un caso completo de préstamo aprobado', async () => {
    const event = {
      body: JSON.stringify({
        email: 'cliente@banco.com',
        ingresosTotales: 2000000,
        prestamosActivos: [
          {
            monto: 1000000,
            tasaMensual: 0.02,
            plazoMeses: 12
          }
        ],
        nuevoPrestamo: {
          monto: 500000,
          tasaMensual: 0.025,
          plazoMeses: 18
        }
      })
    };

    const response = await calcularCapacidad(event);

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.decision).toBe('APROBADO');
    expect(body.capacidadMaxima).toBe(700000); // 35% de 2000000
    expect(body.montoTotal).toBe(500000);
    expect(body.planPagos).toHaveLength(18);
    
    // Verificar que se envió a SQS
    const { sendToSqs, sendToSqsReport } = require('../infrastructure/adapters/SqsAdapter');
    expect(sendToSqs).toHaveBeenCalledWith(
      'cliente@banco.com',
      'Resultado automatico',
      expect.stringContaining('APROBADO')
    );
    expect(sendToSqsReport).toHaveBeenCalledWith(500000);
  });

  test('debe procesar un caso de préstamo rechazado', async () => {
    const event = {
      body: JSON.stringify({
        email: 'cliente@banco.com',
        ingresosTotales: 100000, // Capacidad máxima: 35000
        prestamosActivos: [
          {
            monto: 200000, // Cuota: ~18911
            tasaMensual: 0.02,
            plazoMeses: 12
          }
        ],
        nuevoPrestamo: {
          monto: 200000, // Cuota: ~18911
          tasaMensual: 0.02,
          plazoMeses: 12
        }
      })
    };

    const response = await calcularCapacidad(event);

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.decision).toBe('RECHAZADO');
    expect(body.capacidadDisponible).toBeLessThan(body.cuotaNuevoPrestamo);
    
    // Verificar que NO se envió reporte
    const { sendToSqsReport } = require('../infrastructure/adapters/SqsAdapter');
    expect(sendToSqsReport).not.toHaveBeenCalled();
  });

  test('debe procesar un caso que requiere revisión manual', async () => {
    const event = {
      body: JSON.stringify({
        email: 'cliente@banco.com',
        ingresosTotales: 1000000,
        prestamosActivos: [],
        nuevoPrestamo: {
          monto: 6000000, // 6 veces los ingresos
          tasaMensual: 0.01,
          plazoMeses: 24
        }
      })
    };

    const response = await calcularCapacidad(event);

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.decision).toBe('REVISION MANUAL');
    expect(body.montoTotal).toBe(6000000);
  });

  test('debe manejar errores de validación', async () => {
    const event = {
      body: JSON.stringify({
        email: 'cliente@banco.com',
        ingresosTotales: -1000000, // Ingresos negativos
        prestamosActivos: [],
        nuevoPrestamo: {
          monto: 500000,
          tasaMensual: 0.02,
          plazoMeses: 12
        }
      })
    };

    const response = await calcularCapacidad(event);

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.capacidadMaxima).toBe(-350000); // 35% de -1000000
    expect(body.decision).toBe('RECHAZADO');
  });

  test('debe manejar múltiples préstamos activos', async () => {
    const event = {
      body: JSON.stringify({
        email: 'cliente@banco.com',
        ingresosTotales: 3000000,
        prestamosActivos: [
          {
            monto: 1000000,
            tasaMensual: 0.02,
            plazoMeses: 12
          },
          {
            monto: 500000,
            tasaMensual: 0.015,
            plazoMeses: 24
          },
          {
            monto: 200000,
            tasaMensual: 0.01,
            plazoMeses: 6
          }
        ],
        nuevoPrestamo: {
          monto: 300000,
          tasaMensual: 0.02,
          plazoMeses: 12
        }
      })
    };

    const response = await calcularCapacidad(event);

    expect(response.statusCode).toBe(200);
    
    const body = JSON.parse(response.body);
    expect(body.capacidadMaxima).toBe(1050000); // 35% de 3000000
    expect(body.deudaMensualActual).toBeGreaterThan(0);
    expect(body.capacidadDisponible).toBe(
      body.capacidadMaxima - body.deudaMensualActual
    );
  });
});
