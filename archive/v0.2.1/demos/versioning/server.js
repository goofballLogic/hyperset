var express = require("express"),
	hyperset = require("../../lib/hyperset"),
	riakRepo = require("../../lib/repo-riak"),
	expressAdapter = require("../../lib/adapter-express")
	;

var config = {
	name: "Versioning",
	sets: [ { name: "everything" } ]
};

var app = express()
	.use(express.bodyParser())
	.use(express.logger())
	.use(express.methodOverride());

var repo = new riakRepo.Repo("127.0.0.1", 8098, "hyperset-demos-versioning"),
	sets = new hyperset.Sets(config, { "repo" : repo }),
	adapter = new expressAdapter.Adapter(sets, { "root" : "/versioning", debug: console })
	;

console.log(sets);

adapter.install(app);
app.listen(3000);