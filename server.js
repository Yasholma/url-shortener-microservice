"use strict";

var express = require("express");
var mongo = require("mongodb");
var mongoose = require("mongoose");
var dns = require("dns");
var bodyParser = require("body-parser");
require("dotenv").config();

var cors = require("cors");

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;

/** this project needs a db !! **/

// mongoose.connect(process.env.DB_URI);
mongoose.connect(process.env.DB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

mongoose.connection.on("connected", () => {});

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser heree
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/public", express.static(process.cwd() + "/public"));

app.get("/", function (req, res) {
    res.sendFile(process.cwd() + "/views/index.html");
});

// Schema
const urlSchema = mongoose.Schema({
    original_url: String,
});

const URL = mongoose.model("urls", urlSchema);

const getOrStoreUrl = (req, res, url) => {
    URL.findOne({ original_url: url }, (err, foundUrl) => {
        if (err) return false;
        if (!foundUrl) {
            // Save Into the DB
            const urlToDB = new URL({
                original_url: url,
            });
            urlToDB.save((err, u) => {
                if (err) return false;
                res.json({
                    original_url: u.original_url,
                    short_url: u._id,
                });
            });
        } else {
            res.json({
                original_url: foundUrl.original_url,
                short_url: foundUrl._id,
            });
        }
    });
};

// your first API endpoint...
app.post("/api/shorturl/new", function (req, res) {
    let url = req.body.url;

    if (/^http[s]?:\/\//.test(url)) {
        let dnsUrl = url.slice(url.indexOf("//") + 2);

        dns.lookup(dnsUrl, (err, addresses) => {
            if (err) {
                res.json({ error: "invalid URL" });
            } else {
                getOrStoreUrl(req, res, url);
            }
        });
    } else {
        res.json({ error: "invalid URL" });
    }
});

app.get("/api/shorturl/:url", (req, res, done) => {
    const url = req.params.url;
    URL.findById(url, (err, data) => {
        if (err) return false;
        res.redirect(data.original_url);
    });
    return;
});

app.listen(port, function () {
    console.log("Node.js listening ...");
});
