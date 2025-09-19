// Configuración global para Jest
process.env.NODE_ENV = 'test';
process.env.REGION = 'us-east-1';
process.env.QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-queue';
process.env.REPORT_QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/123456789012/test-report-queue';
process.env.SQS_ARN = 'arn:aws:sqs:us-east-1:123456789012:test-queue';
process.env.REPORT_ARN = 'arn:aws:sqs:us-east-1:123456789012:test-report-queue';
