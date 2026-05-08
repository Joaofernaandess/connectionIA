const s3Service = require('../services/common/s3Service');

exports.upload = s3Service.upload;
exports.uploadAudioLocal = s3Service.uploadAudioLocal;
exports.sendAudioS3 = s3Service.sendAudioS3;

module.exports = exports;
