var express = require('express');
var emojione = require('emojione');
var child_process = require('child_process');
var LedMatrix = require("node-rpi-rgb-led-matrix");
var mqtt = require("mqtt");
var json = require("json");
var fs = require('fs');

var matrix = new LedMatrix(32);
matrix.fill(0,0,0);

var pubsub_client  = mqtt.connect('mqtt://localhost')
var app = express();
var proc;
var filename;

app.use(express.static('/custom-png'));
app.use(express.static('/emojione-png'));

app.get('/emoji/:arg', function (req, res) {
    matrix.fill(0,0,0);
    filename = '';
    if (fs.existsSync('custom-png/' + req.params.arg + '.png')) {
        console.log(filename = 'custom-png/' + req.params.arg + '.png');
    } else if (str = emojione.toImage(':' + req.params.arg + ': ')) {
        console.log(filename = 'emojione-png/' + str.match(/([^/]+.png)/gius)[1]);
    }
    if (filename) {
        child_process.exec('sudo killall led-image-viewer', function() {
            child_process.exec('sudo led-image-viewer -C ' + filename);
        });
        res.send('<image src="/' + filename + '"></image>');
    } else {
        res.end('not found');
    }
});

app.get('/gif/:arg', function (req, res) {
    matrix.fill(0,0,0);
    filename = '';
    if (fs.existsSync('animated-gif/' + req.params.arg + '.gif')) {
        console.log(filename = 'animated-gif/' + req.params.arg + '.gif');
        child_process.exec('sudo killall led-image-viewer', function() {
            child_process.exec('sudo led-image-viewer -C ' + filename);
        });
    }
});

pubsub_client.on('connect', () => {
    pubsub_client.subscribe('/announce');
    pubsub_client.subscribe('/led-matrix/emoji');
    pubsub_client.publish('/announce', 'How are you gentlemen!');
});

pubsub_client.on('message', function (topic, message) {
    console.log('[' + topic + ']' + message);
    if (topic === '/led-matrix/emoji') {
        console.log('Looking for custom-png/' + message + '.png...');
        if (fs.existsSync('custom-png/' + message + '.png')) {
            console.log(filename = 'custom-png/' + message + '.png');
        } else if(str = emojione.toImage(':' + message + ': ')) {
            console.log(filename = 'emojione-png/' + str.match(/([^/]+.png)/gius)[1]);
        }
        child_process.exec('sudo killall led-image-viewer', function() {
            child_process.exec('sudo led-image-viewer -C ' + filename);
        });
    }
    if (topic === '/led-matrix/settings/rotation') {
        console.log('Setting matrix rotation to ' + message + '...');
        matrix.rotate(message);
    }
});

app.listen(3000, function () {
    console.log('Listening on port 3000!');
});