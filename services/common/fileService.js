const axios = require('axios');
const uuid = require('uuid');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const { URL } = require('url');

const s3Service = require('./s3Service');

exports.downloadAndSendS3 = (id, content, subPath) => downloadAndSendS3(id, content, subPath);
exports.deleteFile = (file) => deleteFile(file);

module.exports = exports;

async function downloadAndSendS3(id, content, subPath) {
    const resDownload = await download(id, content);
    const messageText = extractAttachmentText(content);

    if (resDownload.id > 0) {
        if (subPath) {
            resDownload.id = `${subPath}/${resDownload.id}`;
        }

        const response = await s3Service.sendFile(resDownload);

        if (response.uri && response.uri != "") {
            await deleteFile(resDownload.fileLocal);

            const originalName = getOriginalName(content, resDownload.originalFileName);
            const title = originalName || path.basename(content.uri || "");

            return {
                type: response.contentType,
                size: response.contentLength,
                title,
                name: originalName || "",
                uri: response.uri,
                text: messageText
            }
        } else {
            return buildFallbackContent(content);
        }
    } else {
        return buildFallbackContent(content);
    }
}

async function download(id, content) {
    // https://github.com/jshttp/mime-types
    // https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js

    const dir = path.resolve(__dirname, "../..", "public/uploads/files");
    const url = content && content.uri;

    if (!url) {
        console.warn("[FILE_DOWNLOAD_SKIP] Conteúdo sem URI válido.");
        return {
            id: 0,
            fileName: "",
            fileLocal: "",
            contentType: "",
            contentLength: "",
            originalFileName: ""
        };
    }

    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });

    try {
        const headers = buildDownloadHeaders(url, content);
        const response = await axios({
            method: 'get',
            url: `${url}`,
            responseType: 'stream',
            timeout: 2 * 60 * 1000,
            headers
        });

        const contentType = response.headers["content-type"];
        const contentLength = response.headers["content-length"];
        const originalFileName = getFileNameFromContentDisposition(response.headers["content-disposition"]);

        const baseName = uuid.v1();
        const extensionFromFileName = originalFileName ? path.extname(originalFileName) : "";
        const tempExtension = extensionFromFileName || `.${getExtensao(contentType)}`;
        const fileName = `${baseName}${tempExtension}`;
        const fileLocal = `${dir}/${fileName}`;

        const writer = fs.createWriteStream(fileLocal);

        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        });

        return {
            id,
            fileName,
            fileLocal,
            contentType,
            contentLength,
            originalFileName
        }
    } catch (error) {
        const status = error.response ? error.response.status : null;
        const data = error.response ? formatResponseData(error.response.data) : null;
        console.error("[FILE_DOWNLOAD_ERROR]", error.message, status, data);
        return {
            id: 0,
            fileName: "",
            fileLocal: "",
            contentType: "",
            contentLength: "",
            originalFileName: ""
        }
    }
}

async function deleteFile(file) {
    if (!file) {
        return false;
    }

    try {
        fs.unlinkSync(file);
        return true;
    } catch (err) {
        console.error(err);
        return false;
    }
}

function getExtensao(contentType) {
    const extension = mime.extension(contentType);
    return extension || 'bin';
}

function getOriginalName(content = {}, fallback = "") {
    return content.originalName
        || content.name
        || content.title
        || content.filename
        || content.fileName
        || content.caption
        || fallback
        || "";
}

function getFileNameFromContentDisposition(header) {
    if (!header) return "";

    const filenameMatch = header.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
    if (filenameMatch) {
        const encoded = filenameMatch[1] || filenameMatch[2];
        try {
            return decodeURIComponent(encoded);
        } catch (error) {
            return encoded;
        }
    }

    return "";
}

function buildFallbackContent(content = {}) {
    const text = extractAttachmentText(content);

    if (!content || !content.uri) {
        return {
            type: "",
            size: "",
            title: "",
            name: "",
            uri: "",
            text
        };
    }

    const originalName = getOriginalName(content);
    const title = originalName || path.basename(content.uri || "");

    return {
        type: content.type || "application/octet-stream",
        size: content.size || 0,
        title,
        name: originalName || "",
        uri: content.uri,
        text
    };
}

function formatResponseData(data) {
    if (!data) return null;

    if (Buffer.isBuffer(data)) {
        return truncateLogString(data.toString('utf8'));
    }

    if (typeof data === 'object') {
        try {
            return truncateLogString(JSON.stringify(data));
        } catch (error) {
            return '[object]';
        }
    }

    return truncateLogString(String(data));
}

function truncateLogString(str, maxLength = 500) {
    if (!str || str.length <= maxLength) {
        return str;
    }

    return `${str.slice(0, maxLength)}...[truncated]`;
}

function buildDownloadHeaders(url, content = {}) {
    const headers = {};

    if (content.headers && typeof content.headers === "object") {
        Object.assign(headers, content.headers);
    }

    if (!headers.Authorization && shouldAttachBlipAuthorization(url)) {
        const blipKey = resolveBlipAuthorizationKey(content);

        if (blipKey) {
            headers.Authorization = `Key ${blipKey}`;
        }
    }

    return headers;
}

function resolveBlipAuthorizationKey(content = {}) {
    if (content.blipAuthKey) {
        return content.blipAuthKey;
    }

    if (content.useRouterAuth && process.env.BLIP_ROUTER_API_KEY) {
        return process.env.BLIP_ROUTER_API_KEY;
    }

    return process.env.BLIP_MEDIA_AUTH_KEY
        || process.env.BLIP_API_KEY
        || process.env.BLIP_ROUTER_API_KEY
        || "";
}

const BLIP_MEDIA_HOST_SUFFIXES = ["msging.net", "messaginghub.io", "blip.ai"];

function shouldAttachBlipAuthorization(url = "") {
    if (!url) {
        return false;
    }

    try {
        const hostname = new URL(url).hostname;
        return BLIP_MEDIA_HOST_SUFFIXES.some((suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`));
    } catch (error) {
        return false;
    }
}

function extractAttachmentText(content = {}) {
    if (!content || typeof content !== "object") {
        return "";
    }

    const candidates = [
        content.text,
        content.plainText,
        content.displayText,
        content.caption,
        content.description,
        content.body,
        content.label,
        content.fallbackText,
        content.value
    ];

    for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate.trim().length > 0) {
            return candidate.trim();
        }
    }

    return "";
}
