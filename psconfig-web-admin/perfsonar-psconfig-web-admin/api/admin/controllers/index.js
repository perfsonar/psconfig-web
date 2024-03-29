"use strict";

//contrib
const express = require("express");
const router = express.Router();
const jwt = require("express-jwt");
const winston = require("winston");

const config = require("../../config");
const logger = new winston.Logger(config.logger.winston);
const db = require("../../models");

var cache_status = null;

/**
 * @api {get} /health   Get API status
 * @apiGroup            Administrator
 * @apiDescription      Get current API status
 *
 * @apiSuccess {String} status 'ok' or 'failed'
 */
router.get("/health", function (req, res) {
    var status = "ok";
    var msg = "everything looks good";

    //check pwacache status
    if (!cache_status) {
        status = "failed";
        msg = "no status report from pwacache service (yet?)";
    } else {
        if (Date.now() - cache_status.update_time > config.datasource.delay) {
            status = "failed";
            msg =
                "pwacache hasn't reported back for more than " +
                config.datasource.delay +
                " msec";
        }
        if (cache_status.hosts < 10) {
            status = "failed";
            msg = "pwacache is reporting unusually low hosts count..";
        }
    }

    //make sure I can query from db
    db.Host.findOne().exec(function (err, host) {
        if (err) {
            status = "failed";
            msg = err.toString();
        }
        if (!host) {
            status = "failed";
            msg = "no hosts!";
        }
        res.json({ status: status, msg: msg, cache: cache_status });
    });
});

//used by pwacache to report cache status
//it should contain hosts counts
router.post("/health/pwacache", function (req, res) {
    cache_status = req.body;
    cache_status.update_time = Date.now();
    logger.debug(req.body);
    res.send("thanks");
});

router.get(
    "/config",
    jwt({ secret: config.admin.jwt.pub, credentialsRequired: false }),
    function (req, res) {
        res.json({
            service_types: config.meshconfig.service_types,
            mesh_types: config.meshconfig.mesh_types,
            defaults: config.meshconfig.defaults,
            minver: config.meshconfig.minver,
        });
    }
);

router.use("/configs", require("./configs"));
router.use("/testspecs", require("./testspecs"));
router.use("/archives", require("./archives"));
router.use("/hosts", require("./hosts"));
router.use("/hostgroups", require("./hostgroups"));

module.exports = router;
