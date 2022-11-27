var express = require('express');
var {OAuth2Client} = require('google-auth-library');
var path = require('node:path');
var session = require('express-session');

var app = express();
var client = new OAuth2Client(process.env['GOOGLE_CLIENT_ID']);

app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}));

// middleware to test if authenticated
function isAuthenticated (req, res, next) {
    if (req.session.userid) next();
    else next('route');
}

app.get('/', isAuthenticated, function (req, res) {
    res.send('<a href="/logout">Logout</a>');
});

app.get('/', function (req, res) {
    res.redirect('/login_g.html');
});

app.post('/login', express.urlencoded({ extended: false }), function (req, res) {
    // login logic

    req.session.regenerate(function (err) {
        if (err) next(err);

        async function verify() {
            try {
                var ticket = await client.verifyIdToken({
                    idToken: req.body.credential,
                    audience: process.env['GOOGLE_CLIENT_ID'],  // Specify the CLIENT_ID of the app that accesses the backend
                    // Or, if multiple clients access the backend:
                    //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
                });
                var payload = ticket.getPayload();
                var userid = payload['sub'];
                // If request specified a G Suite domain:
                // const domain = payload['hd'];
            }
            catch (err) {
                console.error(err);
            }
    
            req.session.userid = userid;

            req.session.save(function (err) {
                if (err) return next(err);
                res.redirect('/');
            });
        };
        verify();
    });
});

app.get('/logout', function (req, res, next) {
    // logout logic

    req.session.userid = null;
    req.session.save(function (err) {
        if (err) next(err);

        req.session.regenerate(function (err) {
            if (err) next(err);
            res.redirect('/');
        })
    })
})

app.listen(8080);