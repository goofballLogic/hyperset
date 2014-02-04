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


--

<br /><br /><br />


##Protocol
The ``protocol`` component is responsible for:

0. Instantiating the parser dispatcher with given configuration
0. Configuring the server with the routes accepted by the application
0. Instantiating the coordinator and attaching it to the application
0. Decorating incoming http request objects with objects providing access to protocol details.

#####Configuring the server with routes:

The protocol module is instantiated by giving it an ``app`` object (such as an Express app). The ``protocol`` component will then configure the app by making calls such as:

	var parserDispatchModule = require( "../dispatch/parser-dispatcher" );
	var parserDispatcher = new parserDispatchModule.Dispatcher( config );
	var handler = parserDispatcher.dispatch;
	. . .
	app.all( rootUrl, handler );
	app.all( collectionUrlTemplate, handler );
	app.all( deleteCollectionRequestsUrlTemplate, handler );
	app.all( itemUrlTemplate, handler );
	app.all( upsertItemUrlTemplate, handler ); 
	app.all( deleteItemRequestsUrlTemplate, handler );

#####An example of a decorated http request


	{
	
		. . .
		
		hyperset : {
		
			name: "Narmi widgets",
			appURl : "http://www.narmi.com/api",
			addCollectionUrl: "http://www.narmi.com/api",
			collectionUrlTemplate: "http://www.narmi.com/api/{{collectionName}}",
			getCollectionUrl: function( collectionName ) { . . . },
			getDeleteCollectionRequestsUrl: function( collectionName ) { . . . },
			getItemUrlTemplate: function( collectionName ) { . . . },
			getItemUrl: function( collectionName, itemId ) { . . . },
			getUpsertItemUrl: function( collectionName, itemId ) { . . . }
			
		}
		
		. . .
	
	}




<br /><br /><br />


##Policy dispatcher
The ``policy-dispatcher`` is responsible for:

0. blah
0. blah
0. Policy evaluation may result in pre-empting the request dispatcher. To do this, the request should be decorated with a ``response`` object, which must indicate, at least, ``code`` and ``message`` properties. It may also include ``headers`` and ``text``:


		{
			
			response: {
				
				"code" : "302",
				"message" : "Redirect requested to renew subscription",
				"headers" : {
					
					"Location" : "http://www.example.org/"
					
				},
				"text" : "Your subscription has lapsed. You need to buy more credits"
			}
		}

**Note** that, this example may or may not result in an outgoing HTTP 302 Redirect - depending on the behaviour of the ``response-renderer`` and the ``response-dispatcher``. In all likelihood an HTML client would receive a normal 302 Redirect. But, for example, a lower level protocol such as JSON REST might choose to return a JSON entity containing the information, with a status code of 402 Payment Required.

--

<br /><br /><br />


##Request dispatcher
The `request-dispatcher` is responsible for:

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


--

<br /><br /><br />


##Policy selector
The `policy-selector` is responsible for:

0. Instantiating and attaching available protocols based on configuration
0. Compiling a mapping of internal request ``type`` to protocol
0. Finding the incoming content-type and matching it against the map
0. Creating the internal request with the a ``type`` property


The protocol-selector looks for two optional configuration objects:

``protocols`` and ``protocolMapping``

#####Protocol mapping configuration

This is a hash of pattern - protocol-name, with the most preferred mappings at the top.

	"protocolMapping" : [
		
		// this is our extended JSON protocol mapping
		[ "uber-json", ".*+json$" ],
		
		// CSV handles both commas and tabs (fix the name?)
		[ "CSV", ".*+csv$", "*+tsv$" ]
		
	]

**Note** that the following default mappings get added to the bottom of this list. The matching works on a **first-matched** basis so your configured mappings will be preferred to these:

		[ "json", ".*json$" ],
		[ "html", ".*html$" ]

#####Protocol negotiation

The protocol-selector will look for a ``content-type`` header and if found, rely on this header for mapping. It this header is not found, it will inspect any ``accept`` header, and attempt to match the specified data types. If no mapping is found, the protocol-selector will default to ``html``.
####Protocol configuration

This is an array of modules, each of which comprises the entry point for a protocol

	"protocols" : [
	
		// our CSV (and TSV) protocol
		"../../custom-protocols/csv",
		
		// this is our extended JSON protocol (delegates to the built-in one in places)
		"../../custom-protocols/uber-json"
	
	]

#####Instantiation

**When the protocol-selector is attached to an application**,
the configuration is used this to resolve, instantiate and attach instances of each protocol:

var renderers = { };

        
        // instantiate configured renderers
        var modulePaths = config.protocols || [ ];
        modulePaths.forEach( function( modulePath ) {
           
            var protocolModule = require( modulePath );
            new protocolModule.Protocol( config ).attach( app );
        
        }
        
        // instantiate default renderers
        . . .


--

<br /><br /><br />


##Protocols (e.g. HTML protocol, JSON protocol)

###Rendering cycle [ CHANGES PENDING ]
0. Finding the internal request's ``response`` and identifying the outgoing item type
0. Synchronously calling the renderer to obtain the output
0. Setting the output status code
0. Sending the response


#### Configuration

The response dispatcher looks for two optional configuration objects:

#####renderers

This is a hash of named modules, each of which comprises a renderer

	"renderers" : {
		
		"CSV" : "../../custom-renderers/csv-renderer",
		"uber-json" : "../../custom-renderers/uber-json"
		
	}
	

### Instantiation
The dispatcher will use this to create and retain singleton instances of each renderer:

	var renderers = { };
	
	// instantiate default renderers
	. . .
	
	// instantiate configured renderers
	var rendererConfig = config.renderers || { };	
	for( var name in rendererConfig ) {
		
		var path = rendererConfig[ name ];
		var rendererModule = require( path );
		renderers[ name ] = new rendererModule.Renderer( config );
		
	}

It will also compile the mapping table into regular expressions:

	var mappings = [];
	
	// add configured mappings
	var mappingConfig = config.rendererMapping || { }
	for( var pattern in mappingConfig ) {
	
		mappings.push( {
		
			expr: new RegExp( pattern ),
			renderer: mappingConfig[ pattern ]
			
		} );
		
	}
	
	// add default mappings
	. . .

The selected renderer is called with a response object, such as:

	{
		"item-type" : "item",
		"collectionName" : "users",
		"item" : {
			"id" : "bob",
			"content" : { "hello" : "world" }
		},
	}

and will return the correctly rendered output synchronously.


--

<br /><br /><br />


##Coordinator
The coordinator is responsible for:

0. Instantiating the policy-dispatcher, request-dispatcher and response-dispatcher (singletons) using defaults ( or overriden by configuration )
0. Finding incoming internal requests ( prepared by the request dispatcher and friends )
0. Handing off to policy dispatcher
0. Handing off to request dispatcher ( unles pre-emption is required by the policy )
0. Handing off to response dispatcher

####Binding to the HTTP stack
The coordinator functions as middleware for e.g. the Express web server. It uses a middleware function with arity of 4 so that it has access to errors. The coordinator can be attached like so:

	var engine = require( "engine" );
	var coordinator = new engine.Coordinator( config );
	coordinator.attach( app );

where ``app`` is expected to expose the typical express-style interface for middleware:

	app.use = function( middlewareFunction ) {
	
		// on error:
		middlewareFunction( new Error("oops"), req, res, next );
		
		// on non-error:
		middlewareFunction( null, req, res, next );
		
		// if there is no "next" after this call
		middlewareFunction( null, req, res, myCleanUpRoutine );
	
	}


The coordinator passes the ``config`` on to the dispatchers it instantiates.

####Overriding the default dispatchers

On occassion, it may be desireable to decorate or replace the default dispatchers. This may be accomplished by configuration keys ``policy-dispatcher``, ``request-dispatcher``, ``response-dispatcher``as follows:

	{
		
		"response-dispatcher" : "../../custom/auditing-response-dispatcher"
		
	}

The dispatchers are instantiated with the following pattern:

	var responseDispatcherModule = require(
		config[ "response-dispatcher" ] ||
		"./dispatch/response-dispatcher"
	);
	var responseDispatcher = new responseDispatcher.Dispatcher( config );

<div style="padding-bottom: 30em" />