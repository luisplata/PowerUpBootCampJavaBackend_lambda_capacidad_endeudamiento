function handleError(error) {
  return {
    statusCode: 500,
    body: JSON.stringify({
      message: "Ocurrió un error procesando la solicitud",
      error: error.message,
    }),
  };
}

module.exports = { handleError };
