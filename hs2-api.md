#Hyperset(2) repository API



##Existing repositories
The hyperset module comes with built-in Riak and file-based repository implementations. Other repositories are packaged as individual modules. Officially recognised repositories include:
* Riak (hyperset.repos.riak)
* JSON (file-based) (hyperset.repos.json)
* [Planned] SQL Server (2005+) (hyperset-sql-server)
* [Planned] MySQL (???) (hyperset-mysql)
* [Planned] Amazon Dynamo DB (hyperset-dynamo-db)
* [Planned] Microsoft Azure Tables (hyperset-azure-tables)



##Usage
A repository is specified by passing an ***app-specific*** instance to the constructor of the Hyperset engine:

	// create a Riak repo
	var riakUrl = "http://192.168.0.10:8098";
	var appName = "widgets";
	var widgetsRepo = new hyperset.RiakRepo( riakUrl, appName );
	
	// config for the engine's web server
	var configuration = {
		. . .
	};
	
	// build the engine
	var engine = new hyperset.Engine( config, widgetsRepo, function( engine ) {
		
		// launch the web server
		engine.listen();
	
	} );



##Repository API
All repositories must service the following interface. ( &nbsp;&harr;&nbsp; indicates the signature of the ```callback``` argument, not the return value of the function )
####for reading
* getCollections( callback )
	*&nbsp;&nbsp;&harr;&nbsp; ( err, collections )*
* getCollection( collectionName, callback )
	*&nbsp;&nbsp;&harr;&nbsp; ( err, collection )*
* getItem( collectionName, itemId, callback )
	*&nbsp;&nbsp;&harr;&nbsp; ( err, item )*
* getItemOrTemplate( collectionName, itemId, callback )
	*&nbsp;&nbsp;&harr;&nbsp; ( err, itemOrTemplate, isExistingItem )*

####for writing
* addCollection( collectionName, callback )
	*&nbsp;&nbsp;&harr;&nbsp; ( err, addedCollection )*
* upsertItem( collectionName, item, callback )
	*&nbsp;&nbsp;&harr;&nbsp; ( err, item )*
* deleteItem( collectionName, itemId, callback )
	*&nbsp;&nbsp;&harr;&nbsp; ( err )*



##Errors
Errors can either be protocol-specific, or generic. Protocol-specific errors (i.e. those which hyperset recognises as having particular significance) are described below. All repository methods include a ```callback``` argument, which *will* be a function accepting a first argument ```err```. Internal errors *may* be returned in ```err```, or simply thrown in the normal manner.
#####NotFoundError
The ```NotFoundError``` *must* have an attribute ```.code``` with value **404**, and *should* have a prototype of ```Error```.
#####BadRequestError
The ```BadRequestError``` *must* have an attribute ```.code``` with value **400**, and *should* have a prototype of ```Error```.


##getCollections( callback )
###callback( err, collections )
#####collections
```collections``` *must* be an array of ```collection``` json objects, as described below in **getCollection( collectionName, callback )**
#####err
Protocol-specific errors *should not* be returned from this call.



##getCollection( collectionName, callback )
#####collectionName
The name of the collection is the unique identifier for the collection within the application.
###callback( err, collection )
#####collection
A collection *must* conform to the following shape:
	{
		"name" : "--collectionName--",
		"items" : [ 
			{ "id" : "--itemId--" }
			{ "id" : "--itemId--" }
			. . .
		]
	}

*e.g. when empty*

	{
		"name" : "screws", 
		"items" : [ ]
	}
*e.g. when populated*

	{
		"name" : "nails",
		"items" : [
			{ "id" : "NS1002" }
			{ "id" : "NS2004" }
			{ "id" : "SS202" }
		]
	}
#####err
If the collection does not exist, the protocol-specific ```NotFoundError``` *must* be returned.



##getItem( collectionName, itemId, callback )
#####collectionName
The unique identifier of the collection
#####itemId
The unique identifier of the item within the collection
###callback( err, item )
#####err

> ######hyperset tests needed
>
>If the collection does not exist, the protocol-specific ```BadRequestError``` *must* be returned.
>If the collection exists, but the item does not, the protocol-specific ```NotFoundError``` *must* be returned.

#####item
An item *must* conform to the following shape:

	{
		"id" : "--itemId--",
		"content" : --itemContent--
	}
*e.g.*

	{
		"id" : "NS2004",
		"content" : {
			"name" : "2 inch, box head, ring shank",
			"size" : "2 inch"
			"head" : "box"
			"shank" : "ring"
		}
	}



##getItemOrTemplate( collectionName, itemId, callback )
This method should attempt to locate an item by id within the collection specified. If the item does not exist, a template should be returned instead. The template conforms to the specified shape for an item. Hyperset calls this method e.g. when rendering the HTML editing forms, which when submitted result in a call to **upsertItem**. The template should contain an id which is guaranteed to be unique for an item which has not yet been created.

> ######hyperset tests needed
> hyperset will respect the id returned from a subsequent upsertItem call, so there is no necessity for the id returned as part of a template to be the same id as that of the resource eventually created from the template.

#####collectionName
The unique identifier for the collection
#####itemId
The unique identifier of the item within the collection to try to find.
###callback( err, itemOrTemplate, isExistingItem )
#####err
> ######hyperset tests needed
>If the collection does not exist, the protocol-specific ```BadRequestError``` *must* be returned

#####itemOrTemplate
An itemOrTemplate *must* conform to the shape outlined for items in the **getItem** method
#####isExistingItem
If the item was found, this value *must* be truthy. If a template is returned, this value *must* be falsy.



##addCollection( collectionName, callback )
