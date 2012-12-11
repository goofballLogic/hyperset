all = test auto-test sublime-test riak

.PHONY: $(all)

test:
	./node_modules/.bin/buster-test --reporter specification

auto-test:
	./node_modules/.bin/buster-autotest --reporter specification

sublime-test:
	./node_modules/.bin/buster-test --reporter specification --color=none

riak-test:
	./node_modules/.bin/buster-test --reporter specification -c ./spec-integration/buster-riak.js --color=none