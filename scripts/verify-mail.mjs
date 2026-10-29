import assert from 'node:assert/strict';
import { deliverMail } from '../lib/mail-delivery.ts';

const message = { subject: 'Reponer artículo de prueba', text: 'Stock de prueba: 9', alertId: 'initial-test' };
const captured = [];
const mock = async (url, options) => {
  captured.push({ url, options, body: JSON.parse(options.body) });
  return Response.json(url.includes('brevo') ? { messageId: '<test@example.test>' } : { id: 'test-resend' }, { status: 201 });
};
assert.equal(await deliverMail('brevo', 'fake-key', 'sender@example.test', message, mock), '<test@example.test>');
assert.equal(await deliverMail('brevo', 'fake-key', 'sender@example.test', message, mock), '<test@example.test>');
assert.equal(captured[0].url, 'https://api.brevo.com/v3/smtp/email');
assert.equal(captured[0].options.headers['api-key'], 'fake-key');
assert.deepEqual(captured[0].body.to, [{ email: 'zarpadomuebles@gmail.com' }]);
assert.equal(captured[0].body.sender.email, 'sender@example.test');
assert.equal(captured[0].body.textContent, message.text);
assert.match(captured[0].body.headers.idempotencyKey, /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/);
assert.equal(captured[0].body.headers.idempotencyKey, captured[1].body.headers.idempotencyKey);
await deliverMail('brevo', 'fake-key', 'sender@example.test', { ...message, alertId: 'different-test' }, mock);
assert.notEqual(captured[0].body.headers.idempotencyKey, captured[2].body.headers.idempotencyKey);
assert.equal(await deliverMail('resend', 'fake-key', 'sender@example.test', message, mock), 'test-resend');
assert.equal(captured[3].options.headers.Authorization, 'Bearer fake-key');
assert.deepEqual(captured[3].body.to, ['zarpadomuebles@gmail.com']);
assert.equal(captured[3].body.text, message.text);
await assert.rejects(deliverMail('brevo', 'fake-key', 'sender@example.test', message, async () => Response.json({ code: 'unauthorized', message: 'secret-provider-detail' }, { status: 401 })), error => !error.message.includes('secret-provider-detail') && error.message.includes('401'));
await assert.rejects(deliverMail('brevo', 'fake-key', 'sender@example.test', message, async () => Response.json({})), /rechazó/);
await assert.rejects(deliverMail('brevo', 'fake-key', 'sender@example.test', message, async () => new Response('not json')), /respuesta válida/);
assert.match(await deliverMail('brevo', 'fake-key', 'sender@example.test', message, async () => Response.json({ code: 'duplicate_parameter', message: 'Email for the idempotency key has already been processed' }, { status: 400 })), /^brevo-deduplicated:/);
console.log('OK Brevo y Resend: destino fijo, autenticación, claves de repetición y errores. No se enviaron correos reales.');
