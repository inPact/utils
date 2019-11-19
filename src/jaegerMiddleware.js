const { FORMAT_HTTP_HEADERS } = require("opentracing");
const Metrics = require("./metrics");

const jaegerMiddleware = (req, res, next) => {
    let {headers, path, url, method, query, params} = req;
    const tracer = Metrics.tracer;

    const splitPath = req.path.split("/");
    const name = splitPath.filter(s => !s.match(/^\d/)).join("/");
    const ids = splitPath.filter(s => s.match(/^\d/));
    const id = ids.length ? ids[0] : name;
    const span = Metrics.span({name, id});
    span.setTag("http.request.url", url);
    span.setTag("http.request.method", method);
    span.setTag("http.request.path", path);
    span.setTag("id", id);
    const organization = req.auth ? req.auth.organization : null;
    if (organization) {
        span.setTag("organization", organization)
    }
    span.log({query}).log({params});

    tracer.inject(span, FORMAT_HTTP_HEADERS, headers);
    req.headers = headers;
    next();

    res.once("finish", () => {
        span.setTag("http.response.status_code", res.statusCode);
        span.setTag("http.response.status_message", res.statusMessage);
        span.finish();
    });
};

module.exports = jaegerMiddleware;