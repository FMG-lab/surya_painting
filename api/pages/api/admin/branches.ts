export default function handler(req, res) {
  // runtime require to avoid static type resolution issues
  return require('../../../admin/branches').default(req, res);
}
