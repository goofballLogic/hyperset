Feature: File-system repo
	As a user of hyperset
	I want to be able to use a file-system repo
	So that I can test hyperset and see the data stored on disk

Background: some collections exist and a repo is instantiated
    Given some empty collections on disk
    	| users          |
    	| accounts       |
    And a repo object is instantiated

Scenario: getCollection
	Given some items in the "users" collection
		| 1234 | "hello world"         |
		| 2345 | { "hello" : "world" } |
	When I call getCollection for "users"
	Then I should get a list of the items back
		| 1234 | 2345 |

Scenario: getCollection which doesn't exist
	When I call getCollection for "collectionOfEmptyCollections"
	Then I should get a NotFoundError back

Scenario: getItem for non-existant collection
	When I call getItem for item "1234" in collection "collectionOfEmptyCollections"
	Then I should get a ConflictError back

Scenario: getItem for non-existant item in existing collection
	When I call getItem for item "king-richard-3rd" in collection "users"
	Then I should get a NotFoundError back

Scenario: getItem for existing item
	Given some items in the "users" collection
		| 1234  | "hello world"  |
	When I call getItem for item "1234" in collection "users"
	Then I should get the item back
		| 1234  | "hello world"  |

Scenario: getItem for an existing json object
	Given some items in the "accounts" collection
		| 1234 | { "isActive" : true }  |
	When I call getItem for item "1234" in collection "accounts"
	Then I should get the item back
		| 1234 | { "isActive" : true }  |

Scenario: getItemOrTemplate for an existing item
	Given some items in the "users" collection
		| 1234 | "hello world"  |
	When I call getItemOrTemplate for item "1234" in collection "users"
	Then I should get the item back
		| 1234 | "hello world" |
	And isExistingItem should be "true"

Scenario: getItemOrTemplate for non-existing item
	When I call getItemOrTemplate for item "9999" in collection "users"
	Then I should get back a template with itemId "9999"
	And isExistingItem should be "false"

Scenario: addCollection
	When I call addCollection for "subscriptions"
	And I call getCollection for "subscriptions"
	Then I should get an empty collection "subscriptions" back

Scenario: addCollection where collection already exists
	When I call addCollection for "users"
	Then I should get a ConflictError back

Scenario: deleteCollection
	When I call deleteCollection for "users"
	And I call getCollection for "users"
	Then I should get a NotFoundError back

Scenario: insert an Item
	When I call upsertItem
		| accounts | new-item | "Some new content" |
	And I call getItem for item "new-item" in collection "accounts"
	Then I should get the item back
		| new-item | "Some new content" |
	And upsertItem should have indicated an insert

Scenario: Update an item
	Given I call upsertItem
		| accounts | an-item | "Some new content" |
	And I call upsertItem
		| accounts | an-item | "Some updated content" |
	And I call getItem for item "an-item" in collection "accounts"
	Then I should get the item back
		| an-item | "Some updated content" |
	And upsertItem should have indicated an update

Scenario: Insert without an id
	When I call upsertItem
		| accounts | | "Content for TBD" |
	And I call getItem with the returned if for collection "accounts"
	Then I should get the item back
		| * | "Content for TBD" |
	And upsertItem should have indicated an insert

Scenario: Delete an item
	Given I call upsertItem
		| accounts | new-item | "Hello Narmi" |
	When I call deleteItem for item "new-item" in collection "accounts"
	And I call getItem for item "new-item" in collection "accounts"
	Then I should get a NotFoundError back

Scenario: Delete an item in a non-existant collection
	When I call deleteItem for item "yoyo" in collection "non-stuff"
	Then I should get a ConflictError back

Scenario: Delete a non-existant item in a collection
	When I call deleteItem for item "total-eclipse-of-the-heart" in collection "accounts"
	Then I should get a NotFoundError back