export default function handler(req, res) {
  return require('../../../../admin/payments/proof').default(req, res);
}
