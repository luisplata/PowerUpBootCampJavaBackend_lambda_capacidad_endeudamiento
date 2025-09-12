function handleError(error) {
  return {
    statusCode: 500,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Ocurrió un error procesando la solicitud",
      error: error.message,
    }),
  };
}

function resultado(result) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(result),
  };
}

module.exports = { handleError, resultado };
