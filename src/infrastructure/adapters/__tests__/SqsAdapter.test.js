const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { sendToSqs, sendToSqsReport } = require('../SqsAdapter');

// Mock del cliente SQS
jest.mock('@aws-sdk/client-sqs');

describe('SqsAdapter', () => {
  let mockSend;

  beforeEach(() => {
    mockSend = jest.fn();
    SQSClient.mockImplementation(() => ({
      send: mockSend
    }));
    
    // Limpiar mocks
    jest.clearAllMocks();
    
    // Mock por defecto para evitar errores
    mockSend.mockResolvedValue({ MessageId: 'default-message-id' });
  });

  describe('sendToSqs', () => {
    test('debe enviar mensaje correctamente a SQS', async () => {
      const mockResponse = {
        MessageId: 'test-message-id-123',
        MD5OfBody: 'test-md5'
      };
      
      mockSend.mockResolvedValue(mockResponse);

      const result = await sendToSqs('test@example.com', 'Test Subject', 'Test Body');

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(SendMessageCommand));
      
      // Verificar los parámetros del comando
      const command = mockSend.mock.calls[0][0];
      expect(command.input.QueueUrl).toBe(process.env.QUEUE_URL);
      expect(JSON.parse(command.input.MessageBody)).toEqual({
        to: 'test@example.com',
        subject: 'Test Subject',
        body: 'Test Body'
      });

      expect(result).toEqual(mockResponse);
    });

    test('debe manejar errores de SQS', async () => {
      const error = new Error('SQS Error');
      mockSend.mockRejectedValue(error);

      await expect(sendToSqs('test@example.com', 'Test', 'Body'))
        .rejects.toThrow('SQS Error');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    test('debe manejar respuesta sin MessageId', async () => {
      const mockResponse = {
        MD5OfBody: 'test-md5'
        // Sin MessageId
      };
      
      mockSend.mockResolvedValue(mockResponse);

      const result = await sendToSqs('test@example.com', 'Test Subject', 'Test Body');

      expect(result).toEqual(mockResponse);
      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    test('debe formatear correctamente el mensaje JSON', async () => {
      const mockResponse = { MessageId: 'test-id' };
      mockSend.mockResolvedValue(mockResponse);

      await sendToSqs('user@domain.com', 'Préstamo Aprobado', 'Su préstamo ha sido aprobado');

      const command = mockSend.mock.calls[0][0];
      const messageBody = JSON.parse(command.input.MessageBody);
      
      expect(messageBody).toEqual({
        to: 'user@domain.com',
        subject: 'Préstamo Aprobado',
        body: 'Su préstamo ha sido aprobado'
      });
    });
  });

  describe('sendToSqsReport', () => {
    test('debe enviar reporte correctamente a SQS', async () => {
      const mockResponse = {
        MessageId: 'report-message-id-456',
        MD5OfBody: 'report-md5'
      };
      
      mockSend.mockResolvedValue(mockResponse);

      const totalAmount = 1500000;
      const result = await sendToSqsReport(totalAmount);

      expect(mockSend).toHaveBeenCalledTimes(1);
      expect(mockSend).toHaveBeenCalledWith(expect.any(SendMessageCommand));
      
      // Verificar los parámetros del comando
      const command = mockSend.mock.calls[0][0];
      expect(command.input.QueueUrl).toBe(process.env.REPORT_QUEUE_URL);
      expect(JSON.parse(command.input.MessageBody)).toEqual({
        totalAmount: 1500000
      });

      expect(result).toEqual(mockResponse);
    });

    test('debe manejar errores en envío de reporte', async () => {
      const error = new Error('Report SQS Error');
      mockSend.mockRejectedValue(error);

      await expect(sendToSqsReport(1000000))
        .rejects.toThrow('Report SQS Error');

      expect(mockSend).toHaveBeenCalledTimes(1);
    });

    test('debe manejar diferentes tipos de montos', async () => {
      const mockResponse = { MessageId: 'test-id' };
      mockSend.mockResolvedValue(mockResponse);

      // Test con monto decimal
      await sendToSqsReport(1500000.50);
      
      const command = mockSend.mock.calls[0][0];
      const messageBody = JSON.parse(command.input.MessageBody);
      expect(messageBody.totalAmount).toBe(1500000.50);

      // Test con monto 0
      await sendToSqsReport(0);
      
      const command2 = mockSend.mock.calls[1][0];
      const messageBody2 = JSON.parse(command2.input.MessageBody);
      expect(messageBody2.totalAmount).toBe(0);
    });

    test('debe usar la cola de reportes correcta', async () => {
      const mockResponse = { MessageId: 'test-id' };
      mockSend.mockResolvedValue(mockResponse);

      await sendToSqsReport(1000000);

      const command = mockSend.mock.calls[0][0];
      expect(command.input.QueueUrl).toBe(process.env.REPORT_QUEUE_URL);
      expect(command.input.QueueUrl).not.toBe(process.env.QUEUE_URL);
    });
  });
});
