export default function handler(req, res) {
  return require('../../../branches').default(req, res);
}
