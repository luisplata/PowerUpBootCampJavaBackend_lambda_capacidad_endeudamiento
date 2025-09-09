function logInfo(message, data = {}) {
  console.log(JSON.stringify({ level: "INFO", message, data, timestamp: new Date().toISOString() }));
}

function logError(message, error) {
  console.error(JSON.stringify({ level: "ERROR", message, error: error.message, stack: error.stack, timestamp: new Date().toISOString() }));
}

module.exports = { logInfo, logError };
