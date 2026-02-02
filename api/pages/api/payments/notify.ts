export default function handler(req, res) {
  return require('../../../payments/notify').default(req, res);
}
