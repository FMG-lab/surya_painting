export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const banks = [
    { code: 'BCA', name: 'Bank Central Asia', alias: 'bca', swift_code: 'BCAIIDJA' },
    { code: 'BNI', name: 'Bank Negara Indonesia', alias: 'bni', swift_code: 'BNIAIDJA' },
    { code: 'MANDIRI', name: 'Bank Mandiri', alias: 'mandiri', swift_code: 'BMRIIDJA' },
    { code: 'CIMB', name: 'CIMB Niaga', alias: 'cimb', swift_code: 'BNIAIDJA' },
  ];

  res.status(200).json({ banks });
}
