export default function handler(req, res) {
  return require('../../../admin/staff').default(req, res);
}
