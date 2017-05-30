const pg = require('pg');
const bodyParser = require('body-parser');
const express = require('express');
const app = express();
app.use( bodyParser.json() );
app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(express.static(__dirname));

const config = {
    user: 'zosgohpfnlzcdp', //env var: PGUSER
    database: 'dae4i1fdva26ii', //env var: PGDATABASE
    password: 'a3f7b7c8552d07472283ff3e485d3925176f299dfb922b953c0a8e988ccd8fd1', //env var: PGPASSWORD
    host: 'ec2-50-19-219-69.compute-1.amazonaws.com', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
};

const pool = new pg.Pool(config);

app.post('/demerit', function (req, res) {
    const name = req.body.name;
    pool.query('SELECT $1::int AS number', ['2'], function(err, res) {
        if(err) {
            return console.error('error running query', err);
        }

        console.log('number:', res.rows[0].number);
    });
});

app.get('/demerits', function (req, res) {
    pool.query('SELECT * from users', function(err, res) {
        if(err) {
            return console.error('error running query', err);
        }

        console.log('number:', res.rows);
    });
});

const port = process.env.PORT || 3000;
app.listen(port, function () {
    'use strict';
    console.log('listening on *:' + port);
});
