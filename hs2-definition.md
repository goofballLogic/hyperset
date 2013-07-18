## Document conventions

A name bracketed by double-dashes ```--xyz--``` indicates the location of an entity-specific value at run-time. Don't confuse this with ```{{xyz}}``` which is an actual placeholder returned to the caller by the API, as part of a URL template.

Within a code block, multiple possible attribute values are indicated using ``` --or-- ```.

## Design notes

Note that items can only belong to one collection. If you need a many to many relationship, you need to define a collection of "set" items, then link the "member" items to the appropriate sets. 

## Entry point URL
An application endpoint defines the available collections.

	GET http://store.widgets.nearstate.com/

If no Accept header is specified, **text/html** is assumed to be the preferred media type.


##vnd.hyperset.application . . .

Note that the collection represented by these media types is identified by name, so an attempt to add a new collection with the same name will result in a 400 error.

Available media types include:

| Type | Meaning |
|------|---------|
| text/html *or* application/vnd.hyperset.application+html| HTML page <br /> - one list-item + link per collection. <br /> - self-link to application in the &lt;h1&gt; tag <br /> - one &lt;form&gt; to add new collection |
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
			<h3>Collections</h3>
			<form action="http://store.widgets.nearstate.com" method="POST">
				<label for="collectionName">Name</label>
				<input name="collectionName" />
				<input type="submit" value="Add collection" />
			</form>
			<ul>
				<li><a href="http://store.widgets.nearstate.com/--collectionPath--">--collectionName--</a>
				<li><a href="http://store.widgets.nearstate.com/--collectionPath--">--collectionName--</a>
				. . .
			</ul>
		</body>
	</html>

####. . . +json

	{
		name: "widgets",
		links: [ {
			rel: "self",
			href: "http://store.widgets.nearstate.com/",
			name: "widgets",
			type: "application/vnd.hyperset.application+json"
		}, {
			rel: "add-collection",
			href: "http://store.widgets.nearstate.com/",
			name: "Add collection",
			type: "application/vnd.hyperset.collection+json",
			method: "POST"
		}, {
			rel: "collection",
			href: "http://store.widgets.nearstate.com/--collectionPath--,
			name: "--collectionName--,
			type: "application/vnd.hyperset.collection+json"
		}, {
			rel: "collection",
			href: "http://store.widgets.nearstate.com/--collectionPath--,
			name: "--collectionName--,
			type: "application/vnd.hyperset.collection+json"
		},
		. . . ]
	}

####. . . +xml

	TBD
	
##vnd.hyperset.collection . . .

Available media types include:

| Type | Meaning |
|------|---------|
| text/html *or* application/vnd.hyperset.collection+html| HTML page <br/> - one list-item + link per item. <br />- link to the application in the &lt;h1&gt; element<br /> - self-link to collection in the &lt;h2&gt; element <br /> - one form to create a new item in the &lt;form id="add-item" . . .&gt; tag<br /> - one &lt;form&gt; to find the form for adding/updating an item with id in the &lt;form id="locate-upsert-item" . . .&gt;. *NOTE* that submitting this form will result in a redirect to the edit item form (see below) |
| application/json *or* application/vnd.hyperset.collection+json | JSON representation of the collection.|

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
			<ul>
				<li><a href="http://store.widgets.nearstate.com/--itemPath--">--itemId--</a>
				<li><a href="http://store.widgets.nearstate.com/--itemPath--">--itemId--</a>
				. . .
			</ul>
		</body>
	</html>
	
####. . . +json

	{
		name: "--collectionName--",
		links: [ {
			rel: "self",
			href: "http://store.widgets.nearstate.com/--collectionPath--",
			name: "--collectionName--",
			type: "application/vnd.hyperset.collection+json",
			verbs: [ "GET", "DELETE" ]
		}, {
			rel: "application",
			href: "http://store.widgets.nearstate.com",
			name: "widgets",
			type: "application/vnd.hyperset.application+json"
		}, {
			rel: "upsert-item-template",
			href: "http://store.widgets.nearstate.com/{{itemId}}"
			name: "Add/update item",
			type: "application/vnd.hyperset.item+json",
			verbs: [ "PUT" ]
		}, {
			rel: "add-item",
			href: "http://store.widgets.nearstate.com/--collectionPath--",
			name: "Add item",
			type: "application/vnd.hyperset.item+json",
			verbs: [ "POST" ]
		}, {
			rel: "item",
			href: "http://store.widgets.nearstate.com/--itemPath--,
			name: "--itemId--",
			type: "application/vnd.hyperset.item+json"
		}, {
			rel: "item",
			href: "http://store.widgets.nearstate.com/--itemPath--,
			name: "--itemId--",
			type: "application/vnd.hyperset.item+json"
		},
		. . . ]
	}

####. . . +xml

	TBD
	
##vnd.hyperset.item . . .

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
	
####. . . +json

	{
		id: "--itemId--",
		links: [ {
			rel: "self",
			href: "http://store.widgets.nearstate.com/--itemPath--",
			name: "--itemId--",
			type: "application/vnd.hyperset.item+json",
			verbs: [ "GET", "PUT", "DELETE" ]
		}, {
			rel: "collection",
			href: "http://store.widgets.nearstate.com/--collectionPath--",
			name: "--collectionName--",
			type: "application/vnd.hyperset.collection+json",
			verbs: [ "GET", "DELETE" ]
		}
		. . .],
		content: "--itemContent--"
	}

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