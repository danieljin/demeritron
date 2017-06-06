'use strict';

const pg = require('pg-then');
const bodyParser = require('body-parser');
const express = require('express');
const request = require('request');
const app = express();
const apiKey = process.env.API_KEY;
const token = process.env.TOKEN;

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
            form: {token: token}
        }, function (err, httpResponse, body) {

            if (err) {
                console.error(err);
                res.status(500).send('Something broke!');
            } else {
                body = JSON.parse(body);

                const poster = body.members.find((x) => {
                    return x.id === req.body.event.user;
                });

                const text = req.body.event.text;
                const users = text.match(/@\w*/g);
                let promises = [];
                let promisesChris = [];

                for (let user of users) {
                    const username = body.members.find((x) => {
                        return x.id === user.slice(1);
                    });
                    if (username) {
                        promisesChris.push(saveRelationship(poster.name, username.name));
                        promises.push(pool.query(`INSERT INTO users (name, demerits) VALUES ('@${username.name}', 1) ON CONFLICT (name) DO UPDATE SET demerits = users.demerits + 1`));
                    } else {
                        res.status(500).send('Something broke!');
                        return;
                    }
                }

                return Promise.all(promises).then(response => {

                    console.log(response);
                    return Promise.all(promisesChris).then(response => {
                        console.log(response);
                        res.send('awesome');
                    });
                }).catch(err => {

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

        console.error('error running query', err);
        res.status(500).send('Something broke!');
    });
});

app.get('/graph', function (req, res) {
    return getGraph().then((body) => {
        console.log(body);
        res.send(body);
    }).catch(err => {
        console.error('error running query', err);
        res.status(500).send('Something broke!');
    });
});


const port = process.env.PORT || 3001;
app.listen(port, function () {
    console.log('listening on *:' + port);
});

function saveRelationship(fromUser, toUser) {
    const options = {
        url: 'https://demeritron-api.herokuapp.com/demerits',
        method: 'POST',
        json: {apiKey: apiKey, to: toUser, from: fromUser}
    };

    return new Promise((resolve, reject) => {
        request(options, function (err, httpResponse, body) {
            console.log(body);
            if (err) {
                console.error(err);
                reject('Failed to update relationship');
            }
            console.log('sent to chris');
            resolve();
        });
    });
}

function getGraph() {
    return new Promise((resolve, reject) => {
        request.get({
            url: 'https://demeritron-api.herokuapp.com/demerits'
        }, function (err, httpResponse, body) {

            if (err) {
                console.error(err);
                reject('Failed to get relationship');
            }
            resolve(body);
        });
    });
}
