export default function handler(req, res) {
  return require('../../bookings').default(req, res);
}
