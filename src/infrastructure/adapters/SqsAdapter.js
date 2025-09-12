const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");

const sqsClient = new SQSClient({ region: process.env.REGION });

module.exports.sendToSqs = async (to, subject, body) => {
  try {
    const params = {
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify({ to, subject, body }),
    };

    console.log("Usando QueueUrl:", params.QueueUrl);

    const command = new SendMessageCommand(params);
    const response = await sqsClient.send(command);

    console.log("✅ Respuesta completa de SQS:", JSON.stringify(response, null, 2));

    if (response.MessageId) {
      console.log("📩 Mensaje enviado con ID:", response.MessageId);
    } else {
      console.warn("⚠️ No se recibió MessageId en la respuesta");
    }

    return response;
  } catch (err) {
    console.error("❌ Error enviando mensaje a SQS:", err);
    throw err;
  }
};
