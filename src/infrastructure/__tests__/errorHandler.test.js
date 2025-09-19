const { handleError, resultado } = require('../errorHandler');

describe('Error Handler', () => {
  describe('handleError', () => {
    test('debe retornar respuesta de error con status 500', () => {
      const error = new Error('Error de prueba');
      const response = handleError(error);

      expect(response).toEqual({
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Ocurrió un error procesando la solicitud',
          error: 'Error de prueba'
        })
      });
    });

    test('debe manejar errores sin mensaje', () => {
      const error = new Error();
      const response = handleError(error);

      expect(response.statusCode).toBe(500);
      expect(response.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Ocurrió un error procesando la solicitud');
      expect(body.error).toBe('');
    });

    test('debe manejar errores con propiedades personalizadas', () => {
      const error = new Error('Error personalizado');
      error.code = 'CUSTOM_ERROR';
      error.details = { field: 'email' };
      
      const response = handleError(error);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.error).toBe('Error personalizado');
    });
  });

  describe('resultado', () => {
    test('debe retornar respuesta exitosa con status 200', () => {
      const data = { 
        decision: 'APROBADO', 
        montoTotal: 500000,
        planPagos: []
      };
      
      const response = resultado(data);

      expect(response).toEqual({
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
    });

    test('debe manejar datos complejos', () => {
      const data = {
        decision: 'APROBADO',
        capacidadMaxima: 350000,
        deudaMensualActual: 0,
        capacidadDisponible: 350000,
        cuotaNuevoPrestamo: 50000,
        planPagos: [
          {
            mes: 1,
            cuota: '50000.00',
            interes: '10000.00',
            abonoCapital: '40000.00',
            saldoRestante: '460000.00'
          }
        ],
        montoTotal: 500000
      };

      const response = resultado(data);

      expect(response.statusCode).toBe(200);
      expect(response.headers['Content-Type']).toBe('application/json');
      
      const body = JSON.parse(response.body);
      expect(body).toEqual(data);
    });

    test('debe manejar datos vacíos', () => {
      const response = resultado({});

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({});
    });

    test('debe manejar datos null', () => {
      const response = resultado(null);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toBeNull();
    });
  });
});
