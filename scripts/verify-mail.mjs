import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
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
assert.deepEqual(captured[0].body.to, [{ email: 'zarpadomueble@gmail.com' }]);
assert.equal(captured[0].body.sender.email, 'sender@example.test');
assert.equal(captured[0].body.textContent, message.text);
assert.match(captured[0].body.headers.idempotencyKey, /^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89ab][a-f\d]{3}-[a-f\d]{12}$/);
assert.equal(captured[0].body.headers.idempotencyKey, captured[1].body.headers.idempotencyKey);
await deliverMail('brevo', 'fake-key', 'sender@example.test', { ...message, alertId: 'different-test' }, mock);
assert.notEqual(captured[0].body.headers.idempotencyKey, captured[2].body.headers.idempotencyKey);
assert.equal(await deliverMail('resend', 'fake-key', 'sender@example.test', message, mock), 'test-resend');
assert.equal(captured[3].options.headers.Authorization, 'Bearer fake-key');
assert.deepEqual(captured[3].body.to, ['zarpadomueble@gmail.com']);
assert.equal(captured[3].body.text, message.text);
await assert.rejects(deliverMail('brevo', 'fake-key', 'sender@example.test', message, async () => Response.json({ code: 'unauthorized', message: 'secret-provider-detail' }, { status: 401 })), error => !error.message.includes('secret-provider-detail') && error.message.includes('401'));
await assert.rejects(deliverMail('brevo', 'fake-key', 'sender@example.test', message, async () => Response.json({})), /rechazó/);
await assert.rejects(deliverMail('brevo', 'fake-key', 'sender@example.test', message, async () => new Response('not json')), /respuesta válida/);
assert.match(await deliverMail('brevo', 'fake-key', 'sender@example.test', message, async () => Response.json({ code: 'duplicate_parameter', message: 'Email for the idempotency key has already been processed' }, { status: 400 })), /^brevo-deduplicated:/);
console.log('OK Brevo y Resend: destino fijo, autenticación, claves de repetición y errores. No se enviaron correos reales.');

const database = new DatabaseSync(':memory:');
try {
  database.exec(readFileSync(new URL('../drizzle/0000_long_stingray.sql', import.meta.url), 'utf8'));
  const correction = readFileSync(new URL('../drizzle/0001_correct_alert_recipient.sql', import.meta.url), 'utf8');
  database.exec(correction);
  assert.equal(database.prepare('SELECT COUNT(*) n FROM alerts').get().n, 0);
  const insertProduct = database.prepare("INSERT INTO products(id,name,category,unit,quantity,updated) VALUES(?,?,'Pruebas','unidades',?,'2026-10-29T00:00:00.000Z')");
  insertProduct.run('critical', 'Artículo crítico de prueba', 9);
  insertProduct.run('warning', 'Artículo en aviso de prueba', 12);
  insertProduct.run('available', 'Artículo disponible de prueba', 20);
  database.exec("INSERT INTO settings(key,value) VALUES('mail_key','fake-key'),('mail_from','sender@example.test')");
  database.exec(correction);
  assert.equal(database.prepare('SELECT COUNT(*) n FROM alerts').get().n, 0);
  database.exec("INSERT INTO alerts(id,product_id,product_name,quantity,level,status,created) VALUES('previous-notice','critical','Artículo crítico de prueba',9,'critical','sent','2026-10-29T00:00:00.000Z')");
  const quantities = database.prepare('SELECT id,quantity FROM products ORDER BY id').all();
  database.exec(correction);
  database.exec(correction);
  const queued = database.prepare("SELECT product_id,level,status FROM alerts WHERE id LIKE 'recipient-correction-%' ORDER BY product_id").all();
  assert.deepEqual(queued.map(row => ({ ...row })), [
    { product_id: 'critical', level: 'critical', status: 'recipient-update' },
    { product_id: 'warning', level: 'warning', status: 'recipient-update' },
  ]);
  assert.equal(database.prepare("SELECT COUNT(*) n FROM alerts WHERE status='pending'").get().n, 0);
  assert.equal(database.prepare('SELECT COUNT(*) n FROM alerts').get().n, 3);
  assert.equal(database.prepare("SELECT status FROM alerts WHERE id='previous-notice'").get().status, 'sent');
  assert.deepEqual(database.prepare('SELECT id,quantity FROM products ORDER BY id').all(), quantities);
  console.log('OK corrección de destinatario: un aviso por faltante, sin modificar stock ni historial y sin activar envíos antes de publicar.');
} finally {
  database.close();
}
