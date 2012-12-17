var utils = require("../spec/utils/utils"),
	buster = require("buster"),
	hypermedia = require("../lib/hyperset"),
	riakrepo = require("../lib/repo-riak")
	;

buster.spec.expose();

describe("Given riak-repo", function() {

	before(function() {
		this.repo = new riakrepo.Repo("127.0.0.1", 8098, "hyperset-riak-repo-spec");
	});

	describe("when store(setName, itemId, item, callback) called", function() {

		before(function(done) {
			var context = this;
			this.storee = { "hello" : "world", testid: 1234 };
			this.storeeSet = "when-store-set";
			this.repo.empty(context.storeeSet, function() {
				context.repo.store(context.storeeSet, context.storee.testid, context.storee, function(err, result) {
					context.whenStoreArgs = { "err" : err, "result" : result };
					done();
				});
			});
		});

		it("it should return no error", function() {
			expect(this.whenStoreArgs.err).toBeFalsy();
		});

		it("it should return the stored item", function() {
			expect(this.whenStoreArgs.result).toMatch(this.storee);
		});

		describe("and storeSetMeta(setName, meta, callback) called", function() {

			before(function(done) {
				this.repo.storeSetMeta(this.storeeSet, { "morph" : "osis" }, done);
			});

			describe("and index(setName, callback) called", function() {

				before(function(done) {
					var context = this;
					this.repo.index(context.storeeSet, function(err, result) { context.postSetMetaIndexResult = result; done(); });
				});

				it("it should only have one indexed item", function() {
					expect(this.postSetMetaIndexResult.length).toEqual(1);
				});
			});

			describe("and retrieveSetMeta(setName, callback) is called", function() {

				before(function(done) {
					var context = this;
					this.repo.retrieveSetMeta(context.storeeSet, function(err, result) { context.retrieveSetMetaResult = result; done(); });
				});

				it("it should return stored metadata", function() {
					expect(this.retrieveSetMetaResult).toMatch({ "morph" : "osis" });
				});
			});
		});

		describe("and index(setName, callback) is called", function() {

			before(function(done) {
				var context = this;
				this.repo.index(context.storeeSet, function(err, result) {
					context.whenStoreIndexArgs = { "err" : err, "result" : result };
					done();
				});
			});

			it("it should not return error", function() {
				expect(this.whenStoreIndexArgs.err).toBeFalsy();
			});

			it("it should return an array with the store item's id", function() {
				expect(this.whenStoreIndexArgs.result).toMatch([1234]);
			});

		});

		describe("and retrieve(setName, itemId, callback) called", function() {

			before(function(done) {
				var context = this;
				this.repo.retrieve(context.storeeSet, this.storee.testid, function(err, data, meta) {
					context.whenStoreRetrieveArgs = { "err" : err, "data" : data, "meta" : meta};
					done();
				});
			});

			it("it should not return error", function() {
				expect(this.whenStoreRetrieveArgs.err).toBeFalsy();
			});

			it("it should return the stored item", function() {
				expect(this.whenStoreRetrieveArgs.data).toMatch(this.storee);
			});
		});

		describe("and two more items are stored", function() {
			
			before(function(done) {
				var context = this;
				this.repo.store("more-items", "item2", { "item" : 2 }, function() {
					context.repo.store("more-items", "item3", { "item" : 3 }, done);
				});
			});

			describe("and createLink (rel=test) from item3 to the original item", function() {

				before(function(done) {
					var context = this;
					this.repo.createLink("more-items", "item3", "test", this.storeeSet, this.storee.testid, function(err, result) {
						context.createLinkArgs = { "err" : err, "result" : result };
						done();
					});
				});

				it("it should not return an error", function() {
					expect(this.createLinkArgs.err).toBeFalsy();
				});

				describe("and retrieve(setName, itemId, callback) called for item3", function() {

					before(function(done) {
						var context = this;
						this.repo.retrieve("more-items", "item3", function(err, data, meta) {
							context.createLinkRetrieveArgs = { "err" : err, "data" : data, "meta" : meta };
							done();
						});
					});

					it("the metadata should have a link", function() {
						expect(this.createLinkRetrieveArgs.meta.links.length).toEqual(1);
					});

					it("it should link to the original item", function() {
						var link = this.createLinkRetrieveArgs.meta.links[0];
						expect(link.set).toEqual(this.storeeSet, "target set");
						expect(link.itemId).toEqual(this.storee.testid, "target itemId");
					});

					describe("and destroyLink the created link", function() {

						before(function(done) {
							var context = this;
							this.repo.destroyLink("more-items", "item3", "test", this.storeeSet, this.storee.testid, function(err, result) {
								context.destoyLinkArgs = { "err" : err, "result" : result };
								done();
							});
						});

						it("it should not return an error", function() {
							expect(this.destoyLinkArgs.err).toBeFalsy();
						});

						describe("and retrieve(setName, itemId, callback) called for item3", function() {

							before(function(done) {
								var context = this;
								this.repo.retrieve("more-items", "item3", function(err, data, meta) {
									context.destroyLinkRetrieveArgs = { "err" : err, "data" : data, "meta" : meta };
									done();
								});
							});

							it("the metadata should no remaining links", function() {
								expect(this.destroyLinkRetrieveArgs.meta.links.length).toEqual(0);
							});

						});

					});

				});

			});

		});

	});

});