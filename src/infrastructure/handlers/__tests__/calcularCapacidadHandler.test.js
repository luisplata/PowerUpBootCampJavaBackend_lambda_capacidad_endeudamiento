const { calcularCapacidad } = require('../calcularCapacidadHandler');
const CalcularCapacidadService = require('../../../domain/useCase/CalcularCapacidadService');
const { sendToSqs, sendToSqsReport } = require('../../adapters/SqsAdapter');
const { handleError, resultado } = require('../../errorHandler');
const { logInfo, logError } = require('../../logging');

// Mocks
jest.mock('../../../domain/useCase/CalcularCapacidadService');
jest.mock('../../adapters/SqsAdapter');
jest.mock('../../errorHandler');
jest.mock('../../logging');

describe('calcularCapacidadHandler', () => {
  let mockService;
  let mockEjecutar;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock del servicio
    mockEjecutar = jest.fn();
    mockService = {
      ejecutar: mockEjecutar
    };
    CalcularCapacidadService.mockImplementation(() => mockService);
    
    // Mock por defecto para evitar errores
    mockEjecutar.mockReturnValue({
      decision: 'APROBADO',
      montoTotal: 500000,
      planPagos: []
    });
  });

  describe('calcularCapacidad', () => {
    test('debe procesar request exitosamente y enviar a SQS', async () => {
      const mockResultado = {
        decision: 'APROBADO',
        montoTotal: 500000,
        planPagos: [
          {
            mes: 1,
            cuota: '50000.00',
            interes: '10000.00',
            abonoCapital: '40000.00',
            saldoRestante: '460000.00'
          }
        ]
      };

      const mockResponse = {
        statusCode: 200,
        body: JSON.stringify(mockResultado)
      };

      mockEjecutar.mockReturnValue(mockResultado);
      sendToSqs.mockResolvedValue({ MessageId: 'test-id' });
      sendToSqsReport.mockResolvedValue({ MessageId: 'report-id' });
      resultado.mockReturnValue(mockResponse);

      const event = {
        body: JSON.stringify({
          email: 'test@example.com',
          ingresosTotales: 1000000,
          prestamosActivos: [],
          nuevoPrestamo: {
            monto: 500000,
            tasaMensual: 0.02,
            plazoMeses: 12
          }
        })
      };

      const response = await calcularCapacidad(event);

      // Verificar que se llamó al servicio con los datos correctos
      expect(mockEjecutar).toHaveBeenCalledWith({
        ingresosTotales: 1000000,
        prestamosActivos: [],
        nuevoPrestamo: {
          monto: 500000,
          tasaMensual: 0.02,
          plazoMeses: 12
        }
      });

      // Verificar que se envió a SQS
      expect(sendToSqs).toHaveBeenCalledWith(
        'test@example.com',
        'Resultado automatico',
        expect.stringContaining('APROBADO')
      );

      // Verificar que se envió reporte (porque está APROBADO)
      expect(sendToSqsReport).toHaveBeenCalledWith(500000);

      // Verificar logging
      expect(logInfo).toHaveBeenCalledWith('Request recibido', { body: event.body });
      expect(logInfo).toHaveBeenCalledWith('Resultado calculado', mockResultado);

      expect(response).toBe(mockResponse);
    });

    test('debe procesar request con body como objeto', async () => {
      const mockResultado = {
        decision: 'RECHAZADO',
        montoTotal: 500000,
        planPagos: []
      };

      const mockResponse = { statusCode: 200, body: JSON.stringify(mockResultado) };
      mockEjecutar.mockReturnValue(mockResultado);
      sendToSqs.mockResolvedValue({ MessageId: 'test-id' });
      resultado.mockReturnValue(mockResponse);

      const event = {
        body: {
          email: 'test@example.com',
          ingresosTotales: 1000000,
          prestamosActivos: [],
          nuevoPrestamo: {
            monto: 500000,
            tasaMensual: 0.02,
            plazoMeses: 12
          }
        }
      };

      const response = await calcularCapacidad(event);

      expect(mockEjecutar).toHaveBeenCalledWith({
        ingresosTotales: 1000000,
        prestamosActivos: [],
        nuevoPrestamo: {
          monto: 500000,
          tasaMensual: 0.02,
          plazoMeses: 12
        }
      });

      expect(response).toBe(mockResponse);
    });

    test('debe manejar request sin body', async () => {
      const mockResultado = {
        decision: 'RECHAZADO',
        montoTotal: 0,
        planPagos: []
      };

      const mockResponse = { statusCode: 200, body: JSON.stringify(mockResultado) };
      mockEjecutar.mockReturnValue(mockResultado);
      sendToSqs.mockResolvedValue({ MessageId: 'test-id' });
      resultado.mockReturnValue(mockResponse);

      const event = {};

      const response = await calcularCapacidad(event);

      expect(mockEjecutar).toHaveBeenCalledWith({
        ingresosTotales: undefined,
        prestamosActivos: [],
        nuevoPrestamo: undefined
      });

      expect(response).toBe(mockResponse);
    });

    test('debe manejar préstamos activos por defecto', async () => {
      const mockResultado = {
        decision: 'APROBADO',
        montoTotal: 300000,
        planPagos: []
      };

      const mockResponse = { statusCode: 200, body: JSON.stringify(mockResultado) };
      mockEjecutar.mockReturnValue(mockResultado);
      sendToSqs.mockResolvedValue({ MessageId: 'test-id' });
      resultado.mockReturnValue(mockResponse);

      const event = {
        body: JSON.stringify({
          email: 'test@example.com',
          ingresosTotales: 1000000,
          nuevoPrestamo: {
            monto: 300000,
            tasaMensual: 0.02,
            plazoMeses: 12
          }
        })
      };

      await calcularCapacidad(event);

      expect(mockEjecutar).toHaveBeenCalledWith({
        ingresosTotales: 1000000,
        prestamosActivos: [],
        nuevoPrestamo: {
          monto: 300000,
          tasaMensual: 0.02,
          plazoMeses: 12
        }
      });
    });

    test('debe formatear correctamente el mensaje de SQS', async () => {
      const mockResultado = {
        decision: 'APROBADO',
        montoTotal: 500000,
        planPagos: [
          {
            mes: 1,
            cuota: '50000.00',
            interes: '10000.00',
            abonoCapital: '40000.00',
            saldoRestante: '460000.00'
          },
          {
            mes: 2,
            cuota: '50000.00',
            interes: '9200.00',
            abonoCapital: '40800.00',
            saldoRestante: '419200.00'
          }
        ]
      };

      mockEjecutar.mockReturnValue(mockResultado);
      sendToSqs.mockResolvedValue({ MessageId: 'test-id' });
      resultado.mockReturnValue({ statusCode: 200 });

      const event = {
        body: JSON.stringify({
          email: 'test@example.com',
          ingresosTotales: 1000000,
          prestamosActivos: [],
          nuevoPrestamo: {
            monto: 500000,
            tasaMensual: 0.02,
            plazoMeses: 12
          }
        })
      };

      await calcularCapacidad(event);

      expect(sendToSqs).toHaveBeenCalledWith(
        'test@example.com',
        'Resultado automatico',
        expect.stringContaining('El resultado de la validacion automatica es APROBADO')
      );

      expect(sendToSqs).toHaveBeenCalledWith(
        'test@example.com',
        'Resultado automatico',
        expect.stringContaining('Cuota #1 pagarias $50000.00')
      );

      expect(sendToSqs).toHaveBeenCalledWith(
        'test@example.com',
        'Resultado automatico',
        expect.stringContaining('Cuota #2 pagarias $50000.00')
      );
    });

    test('debe manejar errores y llamar handleError', async () => {
      const error = new Error('Error de prueba');
      const mockErrorResponse = {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error' })
      };

      mockEjecutar.mockImplementation(() => {
        throw error;
      });
      handleError.mockReturnValue(mockErrorResponse);

      const event = {
        body: JSON.stringify({
          email: 'test@example.com',
          ingresosTotales: 1000000
        })
      };

      const response = await calcularCapacidad(event);

      expect(logError).toHaveBeenCalledWith('Error en calcularCapacidad', error);
      expect(handleError).toHaveBeenCalledWith(error);
      expect(response).toBe(mockErrorResponse);
    });

    test('debe manejar errores de parsing JSON', async () => {
      const mockErrorResponse = {
        statusCode: 500,
        body: JSON.stringify({ message: 'Error' })
      };

      handleError.mockReturnValue(mockErrorResponse);

      const event = {
        body: 'invalid json'
      };

      const response = await calcularCapacidad(event);

      expect(logError).toHaveBeenCalledWith('Error en calcularCapacidad', expect.any(Error));
      expect(handleError).toHaveBeenCalled();
      expect(response).toBe(mockErrorResponse);
    });

    test('no debe enviar reporte si la decisión no es APROBADO', async () => {
      const mockResultado = {
        decision: 'RECHAZADO',
        montoTotal: 500000,
        planPagos: []
      };

      mockEjecutar.mockReturnValue(mockResultado);
      sendToSqs.mockResolvedValue({ MessageId: 'test-id' });
      resultado.mockReturnValue({ statusCode: 200 });

      const event = {
        body: JSON.stringify({
          email: 'test@example.com',
          ingresosTotales: 1000000,
          prestamosActivos: [],
          nuevoPrestamo: {
            monto: 500000,
            tasaMensual: 0.02,
            plazoMeses: 12
          }
        })
      };

      await calcularCapacidad(event);

      expect(sendToSqs).toHaveBeenCalled();
      expect(sendToSqsReport).not.toHaveBeenCalled();
    });
  });
});
