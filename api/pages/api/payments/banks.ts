export default function handler(req, res) {
  return require('../../../payments/banks').default(req, res);
}
