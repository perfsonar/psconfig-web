'use strict';

//contrib
var express = require('express');
var router = express.Router();
var jwt = require('express-jwt');
var _ = require('underscore');

//mine
var config = require('./config/config');

router.get('/health', function(req, res) {
    res.json({status: 'ok'});
});

function get_menu(user) {
    var scopes = {
        common: []
    };
    if(user) scopes = user.scopes;
    var menus = [];
    config.menu.forEach(function(menu) {
        if(menu.scope && !menu.scope(scopes)) return;
        var _menu = _.clone(menu);
        if(_menu.submenu) {
            _menu.submenu = get_menu(_menu.submenu, scopes);
        }
        menus.push(_menu);
    });
    return menus;
}

router.get('/config', jwt({secret: config.express.jwt.secret, credentialsRequired: false}), function(req, res) {
    var conf = {
        service_types: config.meshconfig.service_types,
        mesh_types: config.meshconfig.mesh_types,
        defaults: config.meshconfig.defaults,
        menu: get_menu(req.user),
    };
    res.json(conf);
});

router.use('/configs', require('./controllers/configs'));
router.use('/testspecs', require('./controllers/testspecs'));
router.use('/services', require('./controllers/services'));
router.use('/hostgroups', require('./controllers/hostgroups'));

module.exports = router;

