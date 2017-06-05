const pg = require('pg-then');
const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const app = express();
const apiKey = process.env.API_KEY;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname));

const config = {
    user: 'zosgohpfnlzcdp', //env var: PGUSER
    database: 'dae4i1fdva26ii', //env var: PGDATABASE
    password: 'a3f7b7c8552d07472283ff3e485d3925176f299dfb922b953c0a8e988ccd8fd1', //env var: PGPASSWORD
    host: 'ec2-50-19-219-69.compute-1.amazonaws.com', // Server hosting the postgres database
    port: 5432, //env var: PGPORT
    max: 10, // max number of clients in the pool
    idleTimeoutMillis: 30000, // how long a client is allowed to remain idle before being closed
    ssl: true,
};

const pool = new pg.Pool(config);

app.post('/demerit', function (req, res) {
    console.log(req.body);

    if (req.body.challenge && req.body.token === 'WVhmv8mvnOcyovJZ3rjPdItm') {
        res.send(req.body.challenge);
        return;
    }
    if (req.body.event && req.body.event.text && req.body.token === 'WVhmv8mvnOcyovJZ3rjPdItm') {
        console.log('good input');
        request.post({
            url: 'https://slack.com/api/users.list',
            form: {token: 'xoxp-2505660362-3155382615-190184986292-86515fbd86e9f5f9052bbe1b5c150023'}
        }, function (err, httpResponse, body) {
            "use strict";
            if (err) {
                console.error(err);
                res.status(500).send('Something broke!');
            } else {
                console.log(body);

                body = JSON.parse(body);

                const text = req.body.event.text;
                const users = text.match(/@\w*/g);
                let promises = [];

                for (let user of users) {
                    const username = body.members.find((x) => {
                        return x.id === user.slice(1);
                    });
                    if (username) {
                        promises.push(pool.query(`INSERT INTO users (name, demerits) VALUES ('@${username.name}', 1) ON CONFLICT (name) DO UPDATE SET demerits = users.demerits + 1`));
                    } else {
                        res.status(500).send('Something broke!');
                        return;
                    }
                }

                return Promise.all(promises).then(response => {
                    "use strict";
                    console.log(response);
                    res.send('awesome');
                }).catch(err => {
                    "use strict";
                    console.error(err);
                });
            }
        });
    } else {
        res.status(400).send('Bad Input!');
    }
});

app.get('/demerits', function (req, res) {
    pool.query('SELECT * from users').then(result => {
        console.log('number:', result.rows);
        res.send(result.rows);
    }).catch(err => {
        "use strict";
        console.error('error running query', err);
        res.status(500).send('Something broke!');
    });
});

const port = process.env.PORT || 3001;
app.listen(port, function () {
    'use strict';
    console.log('listening on *:' + port);
});

function saveRelationship(fromUser, toUser) {
    return new Promise((resolve, reject) => {
        request.post({
            url: 'https://demeritron-api.herokuapp.com/demerits',
            form: {apiKey: apiKey, to: toUser, from: fromUser}
        }, function (err, httpResponse, body) {
            "use strict";
            if (err) {
                console.error(err);
                reject('Failed to update relationship');
            }
            resolve();
        });
    });
}

function getGraph() {
    return new Promise((resolve, reject) => {
        request.get({
            url: 'https://demeritron-api.herokuapp.com/demerits'
        }, function (err, httpResponse, body) {
            "use strict";
            if (err) {
                console.error(err);
                reject('Failed to get relationship');
            }
            resolve(body);
        });
    });
}
