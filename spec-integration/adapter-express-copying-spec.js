var utils = require("../spec/utils/utils"),
	buster = require("buster"),
	hyperset = require("../lib/hyperset"),
	expressadapter = require("../lib/adapter-express"),
	expressContext = require("./scenarios/express-context")
	;

buster.spec.expose();

var rsc = utils.runSaveAndComplete;

describe("Given app, adapter and copy sets config", function() {

	before(function() {
		utils.GivenRepoAndConfig.call(this, "simple-copying");
		this.app = new expressContext.App(3456);
		this.rootUrl = "/rootUrl";
		var expressConfig = this.config.express || {};
		expressConfig.root = this.rootUrl;
		this.adapter = new expressadapter.Adapter(this.sets, expressConfig);
		this.adapter.install(this.app);
	});

	after(function() {
		this.app.dispose();
	});
	
	describe("When POST /rootUrl/forms requested as JSON", function() {

		before(function(done) {
			rsc(this, "postFormsResult", done, this.app.trigger, "POST", "/rootUrl/forms", "application/json", "hello world " + Math.random(), "text/plain");
		});

		it("it contain a copy link", function() {
			var link = utils.findLinkByRel(this.json.links, "copy-to-publishedForms");
			expect(link).toBeTruthy();
		});

		describe("and then GET requests the copy link as JSON", function() {

			before(function(done) {
				var copyURL = utils.findLinkByRel(this.json.links, "copy-to-publishedForms").href;
				rsc(this, "getCopyFormResult", done, this.app.trigger, "GET", copyURL, "application/json");
			});

			it("it should return a link to complete the copy", function() {
				var link = utils.findLinkByRel(this.json.links, "create");
				expect(link).toBeTruthy();
			});

		});
	});

});
