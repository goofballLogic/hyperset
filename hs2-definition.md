#Hyperset(2) module definition
This doc covers the client-facing API for hyperset(2 (0.3.0 - )

### Configuration  and usage
For details of configuring and running the Hyperset server, see [here] [1].
[1]: hs2-usage.md "here"

### Repositories
Hyperset works with a variety of back-end persistence and integration mechanisms. You can implement your own using the API documented [here] [2].

[2]: hs2-api.md "here"

## Design notes

Note that items can only belong to one collection. If you need a many to many relationship, you need to define a collection of "set" items, then link the "member" items to the appropriate sets. 

## Document conventions

A name bracketed by double-dashes ```--xyz--``` indicates the location of an entity-specific value at run-time. Don't confuse this with ```{{xyz}}``` which is an actual placeholder returned to the caller by the API, as part of a URL template.

Within a code block, multiple possible attribute values are indicated using ``` --or-- ```.

	 
## Entry point URL
An application endpoint defines the available collections.

	GET http://store.widgets.nearstate.com/

If no Accept header is specified, **text/html** is assumed to be the preferred media type.


##vnd.hyperset.application . . .

Note that the collection represented by these media types is identified by name, so an attempt to add a new collection with the same name will result in a 400 error.

Available media types include:

| Type | Meaning |
|------|---------|
| text/html *or* application/vnd.hyperset.application+html| HTML page <br /> - one link to the first page of collections <br /> - self-link to application in the &lt;h1&gt; tag <br /> - one &lt;form&gt; to add new collection |
| application/json *or* application/vnd.hyperset.application+json | JSON representation of the application. |
| application/xml *or* application/vnd.hypserset.application+xml | **TBD:** XML representation of the application. |
| application/atom+xml | **TBD:** Atom service document listing the collections available from the server.<br /> Example available here: http://www.ietf.org/rfc/rfc5023.txt (Section 8) |

####. . . +html

	<!DOCTYPE html>
	<html>
		<head>
			<title>Widgets collections</title>
		</head>
		<body>
			<h1><a href="http://store.widgets.nearstate.com">Widgets</a></h1>
			<h2>Application</h2>
			<form action="http://store.widgets.nearstate.com" method="POST">
				<label for="collectionName">Name</label>
				<input name="collectionName" />
				<input type="submit" value="Add collection" />
			</form>
			<a href="http://store.widgets.nearstate.com/--fistPagePath--">Collections</a>
		</body>
	</html>


| Feature                  | Required Entitlement  |
|--------------------------|-----------------------|
| *Add collection* form    | add-collection        |
| Link to collections      | list-collections      |

####. . . +json

	{
		"name": "widgets",
		"links": [ {
			"rel": "self",
			"href": "http://store.widgets.nearstate.com/",
			"name": "widgets",
			"type": "application/vnd.hyperset.application+json"
		}, {
			"rel": "add-collection",
			"href": "http://store.widgets.nearstate.com/",
			"name": "Add collection",
			"type": "application/vnd.hyperset.collection+json",
			"verbs": [ "POST" ]
		}, {
			"rel": "list-collections",
			"href": "http://store.widgets.neartstate.com/--firstPagePath--",
			"name": "List collections",
			"type": "application/vnd.hyperset.collection-list+json"
		} ]
	}

| Feature                  | Required Entitlement  |
|--------------------------|-----------------------|
| *add-collection* link    | add-collection        |
| *list-collections* link  | list-collections      |

####. . . +xml

	TBD
	
##vnd.hyperset.collection-list . . .

Available media types include:

| Type | Meaning |
|------|---------|
| text/html *or*<br/>application/vnd.hyperset.collection-list+html | HTML page<br /> - one list-item + link per collection<br /> - link to the application in the &lt;h1&gt; element<br /> - previous-page link (if available)<br /> - next-page link (if available)<br /> - self-link to this page of collections in the &lt;h2&gt; element|
| application/json *or*<br/>application/vnd.hyperset.collection-list+json | JSON representation of the collection list<br />|

####. . . +html
	
	<!DOCTYPE html>
	<html>
		<head>
			<title>Widgets collections - page --pageNumber--</title>
		</head>
		<body>
			<h1><a href="http://store.widgets.nearstate.com">Widgets</a></h1>
			<h2><a href="http://store.widgets.nearstate.com/--currentPagePath--">Page --pageNumber--</a></h2>
			<h3>Collections</h3>
			<div>
				<a href="http://store.widgets.nearstate.com/--previousPagePath--">Previous page</a>
				<a href="http://store.widgets.nearstate.com/--nextPagePath--">Next page</a>
			</div>
			<ul>
				<li><a href="http://store.widgets.nearstate.com/--collectionPath--">--collectionName--</a></li>
				<li><a href="http://store.widgets.nearstate.com/--collectionPath--">--collectionName--</a></li>
				. . .
			</ul>
		</body>
	</html>


| Feature             | Required Entitlement  |
|---------------------|-----------------------|
| Previous page link  | list-collections      |
| Next page link      | list-collections      |

####. . . +json

	{
		"name": "collections, page --pageNumber--",
		"page-number": --pageNumber--,
		"links": [ {
			"rel": "self",
			"href": "http://store.widgets.nearstate.com/--currentPagePath--",
			"name": "widgets",
			"type": "application/vnd.hyperset.collection-list+json"
		}, {
			"rel": "application",
			"href": "http://store.widgets.nearstate.com",
			"name": "widgets",
			"type": "application/vnd.hyperset.application+json"
    	}, {
			"rel": "previous-page",
			"href": "http://store.widgets.nearstate.com/--previousPagePath--",
			"name": "Previous page",
			"type": "application/vnd.hyperset.collection-list+json"
		}, {
			"rel": "next-page",
			"href": "http://store.widgets.nearstate.com/--nextPagePath--",
			"name": "Next page",
			"type": "application/vnd.hyperset.collection-list+json"
		}, {
			"rel": "collection",
			"href": "http://store.widgets.nearstate.com/--collectionPath--,
			"name": "--collectionName--,
			"type": "application/vnd.hyperset.collection+json"
		}, {
			"rel": "collection",
			"href": "http://store.widgets.nearstate.com/--collectionPath--,
			"name": "--collectionName--,
			"type": "application/vnd.hyperset.collection+json"
		}, 
			. . . 
		]
	}

| Feature                  | Required Entitlement  |
|--------------------------|-----------------------|
| *previous-page* link     | list-collections      |
| *next-page* link         | list-collections      |

####. . . +xml

	TBD
	
##vnd.hyperset.collection . . .

Available media types include:

| Type | Meaning |
|------|---------|
| text/html *or* application/vnd.hyperset.collection+html| HTML page <br/> - one list-item + link per item. <br />- link to the application in the &lt;h1&gt; element<br /> - self-link to collection in the &lt;h2&gt; element <br /> - one form to create a new item in the &lt;form id="add-item" . . .&gt; tag<br /> - one &lt;form&gt; to find the form for adding/updating an item with id in the &lt;form id="locate-upsert-item" . . .&gt;. *NOTE* that submitting this form will result in a redirect to the edit item form (see below) <br /> - link to the *delete collection* state of the application |
| application/json *or* application/vnd.hyperset.collection+json | JSON representation of the collection. <br /> The <code>upsert-item-template</code> link is a template which must be transformed by the caller, substituting <code>{{itemId}}</code> with the id of the item to insert or update. Upon following this (PUT) link, the caller receives a representation of the item, a 201 (if inserted) or 200 (if updated), plus a <code>location</code> header with a link to the item|

####. . . +html

	<!DOCTYPE html>
	<html>
		<head>
			<title>Widgets --collectionName-- collection</title>
		</head>
		<body>
			<h1><a href="http://store.widgets.nearstate.com">Widgets</a></h1>
			<h2><a href="http://store.widgets.nearstate.com/--collectionPath--">--collectionName--</a></h2>
			<h3>Items</h3>
			<form id="locate-upsert-item" action="http://store.widgets.nearstate.com/--locateUpsertItemPath--" method="POST">
				<label for="itemId">Id</label>
				<input name="itemId" />
				<input type="submit" value="Find add/update form" />
			</form>
			<form id="add-item" action="http://store.widgets.nearstate.com/--collectionPath--" method="POST">
				<label for="content">Content</label>
				<textarea name="content"></textarea>
				<input type="submit" value="Add item" />
			</form>
			<div>
				<a href="http://store.widgets.nearstate.com/--deleteCollectionPath--">Delete collection</a>
			</div>
			<ul>
				<li><a href="http://store.widgets.nearstate.com/--itemPath--">--itemId--</a>
				<li><a href="http://store.widgets.nearstate.com/--itemPath--">--itemId--</a>
				. . .
			</ul>
		</body>
	</html>

| Feature                   | Required Entitlements     |
|---------------------------|---------------------------|
| Collection representation | view-collection           |
| *delete-collection* form  | delete-collection         |
| *locate-upsert-item* form | upsert-item               |
| *add-item* form           | add-item                  |
| List of item links        | list-items                |

####. . . +json

	{
		"name": "--collectionName--",
		"links": [ {
			"rel": "self",
			"href": "http://store.widgets.nearstate.com/--collectionPath--",
			"name": "--collectionName--",
			"type": "application/vnd.hyperset.collection+json",
			"verbs": [ "GET", "DELETE" ]
		}, {
			"rel": "application",
			"href": "http://store.widgets.nearstate.com",
			"name": "widgets",
			"type": "application/vnd.hyperset.application+json"
		}, {
			"rel": "upsert-item-template",
			"href": "http://store.widgets.nearstate.com/--collectionPath--/{{itemId}}"
			"name": "Add/update item",
			"type": "application/vnd.hyperset.item+json",
			"verbs": [ "PUT" ]
		}, {
			"rel": "add-item",
			"href": "http://store.widgets.nearstate.com/--collectionPath--",
			"name": "Add item",
			"type": "application/vnd.hyperset.item+json",
			"verbs": [ "POST" ]
		}, {
			"rel": "item",
			"href": "http://store.widgets.nearstate.com/--itemPath--,
			"name": "--itemId--",
			"type": "application/vnd.hyperset.item+json",
			"verbs": [ "GET", "PUT", "DELETE" ]
		}, {
			"rel": "item",
			"href": "http://store.widgets.nearstate.com/--itemPath--,
			"name": "--itemId--",
			"type": "application/vnd.hyperset.item+json",
			"verbs": [ "GET", "PUT", "DELETE" ]
		},
		. . . ]
	}

| Feature                       | Required Entitlements     |
|-------------------------------|---------------------------|
| Collection representation     | view-collection           |
| *self* link DELETE verb       | delete-collection         |
| *upsert-item-template* link   | upsert-item               |
| *add-item* link               | add-item                  |
| List of item links            | list-items                |
| *item* links GET verb         | view-item                 |
| *item* links PUT verb         | upsert-item               |
| *item* links DELETE verb      | delete-item               |

####. . . +xml

	TBD
	
##vnd.hyperset.item . . .

**NOTE:** It is invalid for an item to have an itemId whose value is *deleteRequests* as this is a reserved word in the hypermedia protocol (as the URL ending *--collectionName--/deleteRequests* identifies the delete state of the collection).

Available media types include:

| Type | Meaning |
|------|---------|
| text/html *or* application/vnd.hyperset.item+html | HTML page<br />- link to the application in the &lt;h1&gt; element<br />- link to the item's collection in the &lt;h2&gt; element<br />- self-link to item in the &lt;h3&gt; element<br />- item content<br />- link to the upsert-item page ("Edit")<br />- &lt;form&gt; to delete the item *NOTE* that, if the delete succeeds, the user agent will be redirected to the collection which contained the deleted item. |
| application/json *or* application/vnd.hyperset.item+json | JSON representation of the item. See *vnd.hyperset.item+json* below. |

###. . . +html

*Note*: --itemContent-- below is HTML-escaped.

	<!DOCTYPE html>
	<html>
		<head>
			<title>Widgets --itemId-- item</title>
		</head>
		<body>
			<h1><a href="http://store.widgets.nearstate.com">Widgets</a></h1>
			<h2><a href="http://store.widgets.nearstate.com/--collectionPath--">--collectionName--</a></h2>
			<h3><a href="http://store.widgets.nearstate.com/--itemPath--">--itemId--</a></h3>
			<div id="content">--itemContent--</div>
			<a href="http://store.widgets.nearstate.com/--upsertItemPath--">Edit</a>
			<form method="POST" action="http://store.widgets.nearstate.com/--deleteItemRequestsPath--">
				<input type="hidden" name="itemId" value="--itemId--" />
				<input type="submit" value="Delete" />
			</form>
		</body>
	</html>

| Feature                       | Required Entitlements     |
|-------------------------------|---------------------------|
| Item representation           | view-item                 |
| Collection link               | view-collection           |
| *Edit* link                   | upsert-item               |
| *Delete* form inks            | delete-item               |

####. . . +json

	{
		"id": "--itemId--",
		"links": [ {
			"rel": "self",
			"href": "http://store.widgets.nearstate.com/--itemPath--",
			"name": "--itemId--",
			"type": "application/vnd.hyperset.item+json",
			"verbs": [ "GET", "PUT", "DELETE" ]
		}, {
			"rel": "collection",
			"href": "http://store.widgets.nearstate.com/--collectionPath--",
			"name": "--collectionName--",
			"type": "application/vnd.hyperset.collection+json",
			"verbs": [ "GET", "DELETE" ]
		}, {
			"rel": "app",
			"href": "http://store.widgets.nearstate.com",
			"name": "Widgets",
			"type": "application/vnd.hyperset.application+json"
		} ],
		content: "--itemContent--"
	}

| Feature                       | Required Entitlements     |
|-------------------------------|---------------------------|
| Item representation           | view-item                 |
| *self* link GET verb          | view-item                 |
| *self* link PUT verb          | upsert-item               |
| *self* link DELETE verb       | delete-item               |
| *collection* link             | view-collection           |

####. . . +xml

	TBD
	
##vnd.hyperset.item-editor . . .

Available media types include:

| Type | Meaning |
|------|---------|
| text/html *or* application/vnd.hyperset.item-editor+html | HTML page<br />- link to the application in the &lt;h1&gt; element<br />- link to the item's collection in the &lt;h2&gt; element<br />- if it already exists on the server, a link to item in the &lt;h3&gt; element<br />- &lt;form&gt; to edit the item content, the label of the textarea of which contains either "Create" or "Update" depending on whether the resource already exists on the server |

###. . . +html

	<!DOCTYPE html>
	<html>
		<head>
			<title>Widgets --itemId-- item</title>
		</head>
		<body>
			<h1><a href="http://store.widgets.nearstate.com">Widgets</a></h1>
			<h2><a href="http://store.widgets.nearstate.com/--collectionPath--">--collectionName--</a></h2>
			<h3><a href="http://store.widgets.nearstate.com/--itemPath--">--itemId--</a></h3>
			<form action="http://store.widgets.nearstate.com/--upsertItemPath--" method="POST">
				<label for="itemContent">Create item --or-- Update item content</label>
				<textarea name="itemContent" id="itemContent">--itemContent--</textarea>
				<input type="submit" value="Create --or-- Update" />
			</form>
		</body>
	</html>

| Feature                       | Required Entitlements     |
|-------------------------------|---------------------------|
| Item-editor representation    | upsert-item               |
| *collection* link               | view-collection         |
| *Create* or *Update* form     | upsert-item               |



##vnd.hyperset.collection-delete . . .

Available media types include:

| Type | Meaning |
|------|---------|
| text/html *or* application/vnd.hyperset.item-delete+html | HTML page<br />- link to the application in the &lt;h1&gt; element<br />- &lt;form&gt; to confirm deletion of the collection |

###. . . +html

	<!DOCTYPE html>
	<html>
		<head>
			<title>Widgets --collecitonName-- collection - Delete</title>
		</head>
		<body>
			<h1><a href="http://store.widgets.nearstate.com">Widgets</a></h1>
			<h2>Delete --collectionName--</h2>
			<form id="delete-collection" action="http://store.widgets.nearstate.com/--deleteCollectionPath--" method="POST">
				<div>Please confirm that you wish to delete this collection</div>
				<input type="submit" value="Delete" />
			</form>
		</body>
	</html>

| Feature                          | Required Entitlements     |
|----------------------------------|---------------------------|
| Delete-collection representation | delete-collection         |
