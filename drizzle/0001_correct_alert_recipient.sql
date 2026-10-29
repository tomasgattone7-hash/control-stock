-- Prepare current low-stock notices for the corrected recipient.
-- Keep them separate from pending notices until the updated Worker is running:
-- D1 migrations run before the Worker deployment.
INSERT OR IGNORE INTO alerts
  (id, product_id, product_name, quantity, level, status, created)
SELECT
  'recipient-correction-20261029-' || p.id,
  p.id, p.name, p.quantity,
  CASE WHEN p.quantity < p.minimum THEN 'critical' ELSE 'warning' END,
  'recipient-update',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM products p
WHERE p.quantity <= p.warning
  AND EXISTS (SELECT 1 FROM settings WHERE key = 'mail_key' AND value <> '')
  AND EXISTS (SELECT 1 FROM settings WHERE key = 'mail_from' AND value <> '')
  AND EXISTS (SELECT 1 FROM alerts WHERE status = 'sent');
