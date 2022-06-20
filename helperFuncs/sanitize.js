function sanitize(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        "/": '&#x2F;',
    };

    const reg = /[&<>"'/]/ig;
    return text.replace(reg, (match)=>(map[match]));
}

function unescape(text) {

    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, "/");
}

module.exports = {sanitize, unescape};