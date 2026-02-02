export default function handler(req, res) {
  return require('../../../../admin/payments/verify-batch').default(req, res);
}
