var utils = require("../spec/utils/utils"),
	buster = require("buster"),
	hyperset = require("../lib/hyperset"),
	expressadapter = require("../lib/adapter-express"),
	express = require("express"),
	expressContext = require("./scenarios/express-context")
	;

buster.spec.expose();

var rsc = runSaveAndComplete;

describe("Given app, adapter and simple sets config", function() {

	before(function() {
		utils.GivenRepoAndConfig.call(this, "simple");
		this.app = new expressContext.App(3456);
		this.rootUrl = "/rootUrl";
		this.adapter = new expressadapter.Adapter(this.sets, { "root" : this.rootUrl });
		this.adapter.install(this.app);
	});

	after(function() {
		this.app.dispose();
	});
	
	describe("When GET /rootUrl/forms requested as json", function() {

		before(function(done) {
			rsc(this, "getFormsResult", done, this.app.trigger, "GET", "/rootUrl/forms", "application/json");
		});

		it("it should return json", function() {
			var result = this.getFormsResult;
			expect(result[0].headers["content-type"]).toMatch("json");
		});

		it("it should return an object called forms", function() {
			expect(this.json.name).toEqual("forms");
		});

		it("it should contain a self link to /rootUrl/forms", function() {
			var link = findLinkByRel(this.json.links, "self");
			expect(link.href).toEqual("/rootUrl/forms");
		});

		it("it should contain a create link to /rootUrl/forms", function() {
			var link = findLinkByRel(this.json.links, "create");
			expect(link.href).toEqual("/rootUrl/forms");
		});

		describe("and create link is followed", function() {

			before(function(done) {
				var createLink = findLinkByRel(this.json.links, "create");
				rsc(this, "postFormsResult", done, this.app.trigger, "POST", createLink.href, "application/json", "fish", "text/plain");
			});

			it("it should return 201 Created", function() {
				expect(this.postFormsResult[0].statusCode).toEqual(201);
			});

			it("it should return a representation of the created item", function() {
				expect(this.json.data).toEqual("fish");
			});

			describe("and update link is followed", function() {

				before(function(done) {
					var updateLink = findLinkByRel(this.json.links, "update");
					rsc(this, "updateFormsResult", done, this.app.trigger, "PUT", updateLink.href, "application/json", "fish and chips", "text/plain");
				});

				it("it should return 200 OK", function() {
					expect(this.updateFormsResult[0].statusCode).toEqual(200);
				});

				describe("and when self link is followed", function() {
				
					before(function(done) {
						var selfLink = findLinkByRel(this.json.links, "self");
						rsc(this, "updateFormsSelfResult", done, this.app.trigger, "GET", selfLink.href, "application/json");
					});

					it("it should return the updated data", function() {
						expect(this.json.data).toEqual("fish and chips");
					});

					describe("and when delete link is followed", function() {

						before(function(done) {
							var deleteLink = findLinkByRel(this.json.links, "delete");
							rsc(this, "deleteFormsResult", done, this.app.trigger, "DELETE", deleteLink.href, "application/json");
						});

						it("it should return 200 OK", function() {
							expect(this.deleteFormsResult[0].statusCode).toEqual(200);
						});

						it("it should return the data of the deleted item", function() {
							expect(this.json.data).toEqual("fish and chips");
						});

						describe("and when self link is followed", function() {

							before(function(done) {
								var selfLink = findLinkByRel(this.json.links, "self");
								rsc(this, "deleteFormsSelfResult", done, this.app.trigger, "GET", selfLink.href, "application/json");	
							});

							it("it should return 404 Not found", function() {
								expect(this.deleteFormsSelfResult[0].statusCode).toEqual(404);
							});
						});

					});

				});

			});

		});

	});

	describe("When item added to /rootUrl/filledForms, and GET /rootUrl/filledForms requested without Accept header", function() {
		
		before(function(done) {
			var context = this;
			this.app.trigger("POST", "/rootUrl/filledForms", null, "data=goodbye+and+thanks+for+all+the+fish&Submit=Submit", "application/x-www-form-urlencoded", function() {
				context.postResult = arguments;
				rsc(context, "getResult", done, context.app.trigger, "GET", "/rootUrl/filledForms");
			});
		});

		it("it should return html", function() {
			expect(this.getResult[0].headers["content-type"]).toMatch("text/html");
		});

		it("it should title the set", function() {
			expect(this.data).toMatch("<h1>filledForms</h1>");
		});

		it("it should contain a self link", function() {
			expect(this.data).toMatch("<a href=\"/rootUrl/filledForms\">filledForms</a>");
		});

		it("it should contain a create form", function() {
			expect(this.data).toMatch("<form action=\"/rootUrl/filledForms\" method=\"POST\">");
		});

		it("it should contain a link to the created item", function() {
			var createdLink = /<a href="([^\"]*)">self<\/a>/.exec(this.postResult[1])[1];
			expect(this.data).toMatch("<a href=\"" + createdLink + "\">item</a>");
		});

		describe("and when the link to the created item is followed", function() {

			before(function(done) {
				var createdLink = /<a href="([^\"]*)">self<\/a>/.exec(this.postResult[1])[1];
				rsc(this, "getItemResult", done, this.app.trigger, "GET", createdLink);
			});

			it("it should contain the created data", function() {
				expect(this.data).toMatch("goodbye and thanks for all the fish");
			});

			describe("and when a faux PUT is used to follow the update link", function() {

				before(function(done) {
					var updateLink = /<form action="([^"]*)"(?:[\s\S]*?)method="POST"(?:[\s\S]*?)<h.>Update item(?:[\s\S]*?)<\/form>/g.exec(this.getItemResult[1])[1];
					rsc(this, "updateItemResult", done, this.app.trigger, "POST", updateLink, "application/json", 
						"_method=put&data=hello+dolphins&Submit=Submit", "application/x-www-form-urlencoded");
				});

				it("it should have updated the data", function() {
					expect(this.data).toMatch("hello dolphins");
				});

			});

			describe("and a faux DELETE is used to follow the delete link", function() {

				before(function(done) {
					var deleteLink = /<form action="([^"]*)"(?:[\s\S]*?)method="POST"(?:[\s\S]*?)<h.>Delete item(?:[\s\S]*?)<\/form>/g.exec(this.getItemResult[1])[1];
					rsc(this, "deleteItemResult", done, this.app.trigger, "POST", deleteLink, "application/json",
						"_method=delete&Submit=submit", "application/x-www-form-urlencoded");
				});

				it("it should return status 200", function() {
					expect(this.deleteItemResult[0].statusCode).toEqual(200);
				});

				describe("and the self link is followed", function() {

					before(function(done) {
						var selfLink =  /<a href="([^\"]*)">self<\/a>/.exec(this.postResult[1])[1];
						rsc(this, "deletedItemGetResult", done, this.app.trigger, "GET", selfLink);
					});

					it("it should return a 404 (not found)", function() {
						expect(this.deletedItemGetResult[0].statusCode).toEqual(404);
					});

				});

			});

		});	

	});

});

function findLinkByRel(links, rel) { 
	for(var i = 0; i < links.length; i++) 
		if(links[i].rel==rel) return links[i];
	return null; 
}

function runSaveAndComplete(context, name, done, fn, arg1, argN) {
	var fnArgs = [];
	for(var i = 4; i < arguments.length; i++) { fnArgs.push(arguments[i]); }
	fnArgs.push(function() {
		context[name] = arguments;
		context.data = arguments[1]; 
		delete context.json;
		try { context.json = JSON.parse(context.data); } catch(e){ }
		done();
	});
	fn.apply(context, fnArgs);
}
