export type MailProvider = 'resend' | 'brevo';
type Message = { subject: string; text: string; alertId: string };
const destination = 'zarpadomuebles@gmail.com';

export async function deliverMail(provider: MailProvider, key: string, from: string, message: Message, request: typeof fetch = fetch) {
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('zm-stock-alert:' + message.alertId)));
  digest[6] = (digest[6] & 15) | 64;
  digest[8] = (digest[8] & 63) | 128;
  const hex = Array.from(digest.slice(0, 16), b => b.toString(16).padStart(2, '0')).join('');
  const idempotencyKey = [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  const brevo = provider === 'brevo';
  const response = await request(brevo ? 'https://api.brevo.com/v3/smtp/email' : 'https://api.resend.com/emails', {
    method: 'POST',
    headers: brevo
      ? { 'api-key': key, 'Content-Type': 'application/json', Accept: 'application/json' }
      : { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', 'Idempotency-Key': 'zm-' + message.alertId },
    body: JSON.stringify(brevo ? {
      sender: { name: 'Zarpado Mueble', email: from },
      to: [{ email: destination }], subject: message.subject, textContent: message.text,
      headers: { idempotencyKey },
    } : { from, to: [destination], subject: message.subject, text: message.text }),
    signal: AbortSignal.timeout(10000),
  });
  let result: any;
  try { result = await response.json(); } catch { throw new Error('El servicio de correo no devolvió una respuesta válida. El aviso sigue pendiente.'); }
  if (brevo && response.status === 400 && result.code === 'duplicate_parameter' && /idempotenc/i.test(result.message ?? '')) {
    return 'brevo-deduplicated:' + idempotencyKey;
  }
  const id = brevo ? result.messageId : result.id;
  if (!response.ok || typeof id !== 'string' || !id) {
    throw new Error('El servicio de correo rechazó el envío (' + response.status + '). Revisá la clave, el remitente verificado y la habilitación de envíos en ' + (brevo ? 'Brevo' : 'Resend') + '.');
  }
  return id;
}
