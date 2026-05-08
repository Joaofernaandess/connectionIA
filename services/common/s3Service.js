const path = require('path');
const crypto = require('crypto');
const aws = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
const fs = require('fs');
const { execFile } = require('child_process');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const execFileAsync = promisify(execFile);
const ffmpeg = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';

const fileService = require('./fileService');

exports.upload = upload();
exports.uploadAudioLocal = uploadAudioLocal();
exports.sendAudioS3 = (req, res, next) => sendAudioS3(req, res, next);
exports.sendFile = (params) => sendFile(params);
exports.getPresignedUrl = (urlOriginal, expiresSeconds) => getPresignedUrl(urlOriginal, expiresSeconds);
exports.uploadBase64ToS3 = (base64Data, fileName, contentType = 'application/pdf') => uploadBase64ToS3(base64Data, fileName, contentType);

module.exports = exports;

function upload() {
    return multer({
        dest: path.resolve(__dirname, "../..", "public/uploads/files"),
        storage: multerS3({
            s3: new aws.S3(),
            bucket: process.env.BUCKET_NAME,
            contentType: multerS3.AUTO_CONTENT_TYPE,
            acl: "public-read",
            key: (req, file, cb) => {
                crypto.randomBytes(16, (err, hash) => {
                    if (err) cb(err);
                    const fileName = `${req.params.id}/${hash.toString("hex")}-${file.originalname}`;
                    cb(null, fileName);
                });
            }
        }),
        // limits: {
        //     fileSize: 2 * 1024 * 1024
        // },
        fileFilter: (req, file, cb) => {
            cb(null, true);
        }
    }).single("file");
}

function uploadAudioLocal() {
    return multer({
        dest: path.resolve(__dirname, "../..", "public/uploads/files"),
        fileFilter: (req, file, cb) => {
            cb(null, true);
        }
    }).single("file");
}

async function sendAudioS3(req, res, next) {
    const originalPath = req.file && req.file.path;
    let convertedPath = null;

    try {
        await ensureVoiceAudio(req.file);
        convertedPath = req.file.path;

        const key = await fileName(req.params.id, req.file, "ogg");
        const s3 = new aws.S3();
        const body = await readFile(req.file.path);

        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: key,
            Body: body,
            ACL: "public-read",
            ContentType: req.file.mimetype
        };

        const result = await s3.putObject(params).promise();

        req.file["uri"] = geraUri(key, result);

        next();
    } catch (err) {
        console.error(err);
        next(err);
    } finally {
        if (originalPath) {
            fileService.deleteFile(originalPath);
        }

        if (convertedPath && convertedPath !== originalPath) {
            fileService.deleteFile(convertedPath);
        }
    }

    // https://stackoverflow.com/questions/51662622/how-to-get-a-wav-file-from-a-post-body-to-upload-it-using-node-js-express/51662942
}

async function sendFile(params) {
    try {
        const fileContent = fs.readFileSync(params.fileLocal);
        const key = `${params.id}/${params.fileName}`;

        const s3 = new aws.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        });

        const paramsS3 = {
            Bucket: process.env.BUCKET_NAME,
            Key: key,
            Body: fileContent,
            ACL: "public-read",
        };

        // Uploading files to the bucket
        const res = await s3.upload(paramsS3, function (err, data) {
            if (err) {
                throw err;
            }
            console.log(`File uploaded successfully. ${data.Location}`);
        }).promise();

        params["uri"] = res.Location;

        if (!res.Location)
            return {};

        return params;
    } catch (error) {
        return {};
    }
}


/**
 * Gera uma URL pré-assinada do S3 a partir de uma URL pública/bruta
 * @param {string} urlOriginal - URL pública do S3 (sem assinatura)
 * @param {number} [expiresSeconds] - Tempo de expiração em segundos (padrão: 43200 = 12h)
 * @returns {Promise<string>}
 */
async function getPresignedUrl(urlOriginal, expiresSeconds = 43200) {
    const urlObj = new URL(urlOriginal);
    const bucket = urlObj.hostname.split('.')[0];
    const key = decodeURIComponent(urlObj.pathname.replace(/^\//, ''));

    const s3 = new aws.S3({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: 'sa-east-1'
    });

    return s3.getSignedUrlPromise('getObject', {
        Bucket: bucket,
        Key: key,
        Expires: expiresSeconds
    });
}

/**
 * Faz upload de dados base64 para o S3 e retorna a URL pública
 * @param {string} base64Data - Dados em base64 (pode incluir prefixo data:...)
 * @param {string} fileName - Nome do arquivo
 * @param {string} contentType - Tipo de conteúdo (padrão: application/pdf)
 * @returns {Promise<string>} URL pública do arquivo no S3
 */
async function uploadBase64ToS3(base64Data, fileName, contentType = 'application/pdf') {
    try {
        // Remove o prefixo data:application/pdf;base64, se existir
        const base64Pure = base64Data.includes(',') 
            ? base64Data.split(',')[1] 
            : base64Data;
        
        // Converte base64 para buffer
        const buffer = Buffer.from(base64Pure, 'base64');
        
        // Gera nome único para o arquivo
        const hash = crypto.randomBytes(8).toString('hex');
        const s3Key = `notificacao-ativa/${hash}-${fileName}`;
        
        // Faz upload para o S3
        const s3 = new aws.S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION || 'sa-east-1'
        });
        
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
            ACL: 'public-read',
            ContentType: contentType
        };
        
        const result = await s3.putObject(params).promise();
        
        // Retorna a URL pública
        const url = `https://${process.env.BUCKET_NAME}.s3.${process.env.AWS_REGION || 'sa-east-1'}.amazonaws.com/${s3Key}`;
        console.log(`PDF uploaded to S3: ${url}`);
        
        return url;
    } catch (error) {
        console.error('Erro ao fazer upload do PDF para S3:', error);
        throw new Error('Não foi possível fazer upload do arquivo PDF');
    }
}

async function fileName(id, file, ext) {
    return await new Promise((resolve, reject) => {
        return crypto.randomBytes(16, (err, hash) => {
            if (err) {
                console.log(err)
                reject(null);
            }

            const fileName = `${id}/${hash.toString("hex")}-${file.originalname}` + (ext ? `.${ext}` : ``);

            resolve(fileName);
        });
    });
}

function geraUri(key, uri) {
    return `https://${process.env.BUCKET_NAME}.s3.amazonaws.com/${key}`;
}

async function ensureVoiceAudio(file) {
    if (!file || !file.path) {
        throw new Error("Arquivo de áudio inválido.");
    }

    const outputPath = `${file.path}.ogg`;

    await execFileAsync(ffmpeg, [
        '-y',
        '-i', file.path,
        '-ac', '1',
        '-ar', '16000',
        '-c:a', 'libopus',
        '-b:a', '32k',
        '-application', 'voip',
        outputPath
    ]);

    file.path = outputPath;
    file.mimetype = 'audio/ogg';
    file.size = fs.statSync(outputPath).size;
}
