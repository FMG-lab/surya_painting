export default function handler(req, res) {
  return require('../../../../admin/payments/verify').default(req, res);
}
