var express = require("express"),
	hyperset = require("../../lib/hyperset"),
	riakRepo = require("../../lib/repo-riak"),
	expressAdapter = require("../../lib/adapter-express")
	;

var config = {
		name: "Basic",
		sets: [ { name: "everything" } ]
	};

var app = express(),
	repo = new riakRepo.Repo("127.0.0.1", 8098, "hyperset-demos-basic"),
	sets = new hyperset.Sets(config, { "repo" : repo }),
	adapter = new expressAdapter.Adapter(app, sets, { "root" : "/basic" })
	;

app.listen(3000);