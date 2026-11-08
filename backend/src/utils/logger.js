const winston = require('winston');

const isTest = process.env.NODE_ENV === 'test';


const SENSITIVE_KEY = /pass(word)?|hash|token|secret|authorization|cookie|jwt|jti/i;

function redactValue(value, depth = 0) {
  if (depth > 5) return '[TRUNCATED]';
  if (Array.isArray(value)) return value.map((item) => redactValue(item, depth + 1));
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        SENSITIVE_KEY.test(key) ? '[REDACTED]' : redactValue(child, depth + 1),
      ])
    );
  }
  return value;
}

const redactFormat = winston.format((info) => Object.assign(info, redactValue({ ...info })));

const transports = [new winston.transports.Console({ silent: isTest })];


let logtailClient = null;
const sourceToken = process.env.BETTER_STACK_SOURCE_TOKEN;
const ingestingHost = (process.env.BETTER_STACK_INGESTING_HOST || '').replace(/^https?:\/\//, '');

if (!isTest && sourceToken && ingestingHost) {
  const { Logtail } = require('@logtail/node');
  const { LogtailTransport } = require('@logtail/winston');
  logtailClient = new Logtail(sourceToken, { endpoint: `https://${ingestingHost}` });
  transports.push(new LogtailTransport(logtailClient));
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  defaultMeta: { service: 'hustlehub-api' },
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    redactFormat(),
    winston.format.json()
  ),
  transports,
});

// Sends any logs still waiting in memory to Better Stack. Called when the server shuts down.
async function flushLogs() {
  if (logtailClient) {
    await logtailClient.flush();
  }
}

// Logs an unexpected server error with its stack trace. The stack stays in the
// logs only: it is never sent to the client.
function logServerError(event, err, meta = {}) {
  logger.error(event, {
    ...meta,
    error: err && err.message,
    stack: err && err.stack,
  });
}

module.exports = { logger, flushLogs, logServerError, cloudLoggingEnabled: !!logtailClient };