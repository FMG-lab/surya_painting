export default function handler(req, res) {
  return require('../../../../technicians/tasks').default(req, res);
}
