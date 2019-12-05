const initTracerFromEnv = require("jaeger-client").initTracerFromEnv;
const client = require("prom-client");
const PrometheusMetricsFactory = require("jaeger-client").PrometheusMetricsFactory;

const serviceName = process.env.JAEGER_SERVICE_NAME || "JAEGER_SERVICE_NAME";
const metrics = new PrometheusMetricsFactory(client, serviceName);

const spans = new Map();

class Metrics {
    constructor() {
        this.tracer = initTracerFromEnv({
            serviceName
        }, {
            metrics,
            logger: {
                info: function logInfo(msg) {
                    console.log("INFO  ", msg);
                },
                error: function logError(msg) {
                    console.log("ERROR ", msg);
                },
            },
        });
        this.errorCount = new client.Counter({
            name: "error_count",
            help: "error rate",
            labelNames: ["serviceName", "organization", "error"]
        });
        this.lockAcquireCount = new client.Counter({
            name: "lock_acquire_count",
            help: "lock acquire rate",
            labelNames: ["serviceName", "namespace"]
        });
        this.lockErrorCount = new client.Counter({
            name: "lock_error_count",
            help: "lock error rate",
            labelNames: ["serviceName", "namespace", "error"]
        });
        this.cacheHitCount = new client.Counter({
            name: "cache_hit_count",
            help: "cache hit rate",
            labelNames: ["serviceName", "organization", "name"]
        });
        this.cacheMissCount = new client.Counter({
            name: "cache_miss_count",
            help: "cache miss rate",
            labelNames: ["serviceName", "organization", "name"]
        });
        this.cacheGetDataCount = new client.Counter({
            name: "cache_get_data_count",
            help: "cache get data rate",
            labelNames: ["serviceName", "organization", "name"]
        });
        this.resourceLockSummary = new client.Summary({
            name: "resource_lock_summary",
            help: "resource lock ms",
            percentiles: [0.01, 0.1, 0.9, 0.99],
            labelNames: ["serviceName", "organization", "resource"]
        });
        this.serviceFlowSummary = new client.Summary({
            name: "service_flow_summary",
            help: "service flow ms",
            percentiles: [0.01, 0.1, 0.9, 0.99],
            labelNames: ["serviceName", "organization", "api", "span"]
        });
        this.cacheRetrieveSummary = new client.Summary({
            name: "cache_retrieve_summary",
            help: "service flow ms",
            percentiles: [0.01, 0.1, 0.9, 0.99],
            labelNames: ["serviceName", "organization", "name"]
        });
       this.dbReadSummary = new client.Summary({
            name: "db_read_summary",
            help: "db read",
            percentiles: [0.01, 0.1, 0.9, 0.99],
            labelNames: ["serviceName", "organization", "collection"]
        });
       this.dbWriteSummary = new client.Summary({
            name: "db_write_summary",
            help: "db read",
            percentiles: [0.01, 0.1, 0.9, 0.99],
            labelNames: ["serviceName", "organization", "collection"]
        });
    }

    startSpan({name, id, parentId, tags = {}}) {
        const childOf = parentId ? spans.get(parentId) : undefined;
        const span = this.tracer.startSpan(name, {childOf});
        spans.set(id, {name, span});
        Object.keys(tags).forEach(t => span.setTag(t, tags[t]));
        const _finish = span.finish.bind(span);
        span.finish = () => {
            spans.delete(id);
            _finish();
        };
        return span;
    }

    span({name, id, parentId, tags = {}}) {
        const currSpan = spans.get(id);
        if (currSpan) {
            return currSpan.span;
        }
        return this.startSpan({name, id, parentId, tags})
    }

    errorInc({organization, error}) {
        this.errorCount.inc({serviceName, organization, error});
    }

    lockAcquireInc({namespace}) {
        this.lockAcquireCount.inc({serviceName, namespace});
    }

    lockErrorInc({namespace, error}) {
        this.lockErrorCount.inc({serviceName, namespace, error});
    }

    cacheHitInc({organization, name}) {
        this.cacheHitCount.inc({serviceName, organization, name});
    }

    cacheMissInc({organization, name}) {
        this.cacheMissCount.inc({serviceName, organization, name});
    }

    cacheGetDataInc({organization, name}) {
        this.cacheGetDataCount.inc({serviceName, organization, name});
    }

    resourceLockStartTimer({organization, resource}) {
        return this.resourceLockSummary.startTimer({serviceName, organization, resource});
    }

     cacheRetrieveStartTimer({organization, name}) {
        return this.cacheRetrieveSummary.startTimer({serviceName, organization, name});
    }
     dbReadStartTimer({organization, collection}) {
        return this.dbReadSummary.startTimer({serviceName, organization, collection});
    }

     dbWriteStartTimer({organization, collection}) {
        return this.dbWriteSummary.startTimer({serviceName, organization, collection});
    }

    spanTimer({organization, name, childOf, tags = {}}) {
        const {name: apiName, span} = spans.get(childOf) || {};
        const endTimer = this.serviceFlowSummary.startTimer({serviceName, organization, api: apiName, span: name});
        const timerSpan = this.tracer.startSpan(name, {childOf: span});
        timerSpan.setTag("organization", organization);
        Object.keys(tags).forEach(t => timerSpan.setTag(t, tags[t]));
        return {
            log: (options) => {
                const msg = typeof options === "string" ? {message: options} : options;
                timerSpan.log(msg);
            },
            finish: () => {
                timerSpan.finish();
                endTimer();
            }
        }
    }

}

module.exports = new Metrics();