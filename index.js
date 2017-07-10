'use strict';

const bodyParser = require('body-parser');
const express = require('express');
const got = require('got');
const app = express();
const apiKey = process.env.API_KEY;
const token = process.env.TOKEN;

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(express.static(__dirname));

app.post('/demerit', function (req, res) {
    console.log(req.body);

    if (req.body.challenge && req.body.token === 'WVhmv8mvnOcyovJZ3rjPdItm') {
        res.send(req.body.challenge);
        return;
    }

    if (req.body.event && req.body.event.text && req.body.event.user && req.body.token === 'WVhmv8mvnOcyovJZ3rjPdItm') {
        const text = req.body.event.text;
        const posterId = req.body.event.user;
        const users = text.match(/@\w*/g);

        if (users && users.length > 0) {
            console.log('good input');

            const options = {
                form: true,
                body: {
                    "token": token
                }
            };

            return got('https://slack.com/api/users.list', options).then(response => {
                const body = JSON.parse(response.body);

                const poster = body.members.find(x => {
                    return x.id === posterId;
                });

                let promises = [];

                if (poster) {
                    for (let aUser of users) {
                        const user = body.members.find((x) => {
                            return x.id === aUser.slice(1);
                        });
                        if (user && user.id !== poster.id) {
                            if (text.indexOf(':demerit:') > -1) {
                                promises.push(saveDemerit(poster.name, user.name));
                            } else {
                                promises.push(saveMention(poster.name, user.name));
                            }
                        }
                    }

                    return Promise.all(promises).then(response => {
                        console.log(response);
                        res.send('awesome');
                    });
                } else {
                    res.status(400).send('Bad Input!');
                }
            }).catch(err => {
                console.error(err);
                res.status(500).send('Something broke!');
            });
        } else {
            res.status(400).send('Bad Input!');
        }
    } else {
        res.status(400).send('Bad Input!');
    }
});

app.get('/graph', function (req, res) {
    return got('https://demeritron-api.herokuapp.com/data').then((response) => {
        console.log(response.body);
        res.send(response.body);
    }).catch(err => {
        console.error('Failed to get relationship', err);
        res.status(500).send('Something broke!');
    });
});

app.get('/graph/:username', function (req, res) {
    const username = req.params.username;
    return got('https://demeritron-api.herokuapp.com/data/' + username).then((response) => {
        console.log(response.body);
        res.send(response.body);
    }).catch(err => {
        console.error('Failed to get relationship', err);
        res.status(500).send('Something broke!');
    });
});


const port = process.env.PORT || 3001;
app.listen(port, function () {
    console.log('listening on *:' + port);
});

function saveDemerit(fromUser, toUser) {
    const options = {
        json: true,
        body: {apiKey: apiKey, to: toUser, from: fromUser}
    };

    return got.post('https://demeritron-api.herokuapp.com/demerits', options).then(response => {
        console.log(`sent relationship from:${fromUser} to:${toUser}`);
        return response;
    }).catch(err => {
        console.error(`Failed to add demerit from:${fromUser} to:${toUser}`);
        throw err;
    });
}

function saveMention(fromUser, toUser) {
    const options = {
        json: true,
        body: {apiKey: apiKey, to: toUser, from: fromUser}
    };

    return got.post('https://demeritron-api.herokuapp.com/mentions', options).then(response => {
        console.log(`sent relationship from:${fromUser} to:${toUser}`);
        return response;
    }).catch(err => {
        console.error(`Failed to add mention from:${fromUser} to:${toUser}`);
        throw err;
    });
}
