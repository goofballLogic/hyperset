#Hyperset(2) components

###Overview

When a request is received by Hyperset, one of the request parsers is responsible for turning the incoming HTTP request into an internal representation of the request. The Coordinator then receives this request and hands it off to various components in turn. Typically, the request visits the following components:

1. Policy dispatcher
2. Request dispatcher
3. Response dispatcher

###Internal request object
The internal request follows patterns such as the following:

#####Queries

_view item_

	{
		"type" : "json",
		"collection" : "widgets",
		"id" : "ABC-1234"
	}
_view items in a set_

	{
		"type" : "html",
		"collection" : "widgets",
	}
	
#####Commands

_get item or template for new item_

	{
		"type" : "xml",
		"collection" : "widgets",
		"id" : "ABC-1234",
		"command" : "get-or-template"
	}
_delete a collection_

	{
		"type" : "html",
		"collection" : "widget",
		"command" : "delete"
	}
_insert or update an item with undefined id_

	{
		"type" : "json",
		"collection" : "widget",
		"id" : null
		"command" : "upsert",
		"content" : {
			"hello" : "world"
		}
	}
_insert or update an item by id_

	{
		"type" : "atom",
		"collection" : "widget",
		"id" : "ABC-1234",
		"content" : {
			"title" : "Narmi hex-head screw",
			"price" : "2.99"
		}
	}

####Internal response object
The internal response contains all items returned in the callback from the repo call.

#####Example (get item or template)

The repo call looks like:


&nbsp;&nbsp;&nbsp;getItemOrTemplate( collectionName, itemId, callback ) ***&nbsp;&nbsp;&harr;&nbsp; ( err, itemOrTemplate, isExistingItem )***

so you can see three properties within the response object. In addition, the dispatchers add some other data such as `repository-name` which is added by the `request dispatcher`  .
	
	{
		"type" : "xml",
		"collection" : "widgets",
		"id" : "ABC-1234",
		"command" : "get-or-template",
		. . .
		"response" : {
			"err" : undefined,
			"item" : {
				"id" : "ABC-1234",
				"content" : {
					"title" : "Narmi hex-head screw",
					"price" : "2.99"
				}
			},
			"isExistingItem" : true,
		},
		. . .
		"repository-name" : "file-system",
		. . .
	}
 
	
##Request dispatcher
The `request dispatcher` is responsible for:

1. Obtaining an instance of the correct repository, based on the configuration hash supplied to its constructor object
2. Inspecting the incoming `request`, translating that request into repository calls
3. Adding the internal `response` object into the request object
4. Adding the `repository-name` property into the request object


#### Configuration and instantiation

The request dispatcher looks for a `repository` configuration item with the following format:

	{
		. . .
		"repository" : {
			"name" : "file-system",
			"path" : "./repos/fs-repo"
			. . .
		}
		. . .
	}
The dispatcher will use this to create and retain a singleton instance of the repository object by passing the "repository" configuration hash to the repo's constructor as follows:

	var repoConfig = config.repository;
	var repoModule = require( repoConfig.path );
	var repo = new repoModule.Repo( repoConfig );
	var repoName = repoConfig.name;
