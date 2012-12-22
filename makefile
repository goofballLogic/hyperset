all = test auto-test sublime-test riak-test express-test

.PHONY: $(all)

test:
	./node_modules/.bin/buster-test --reporter specification

test-dot:
	./node_modules/.bin/buster-test
	
auto-test:
	./node_modules/.bin/buster-autotest --reporter specification

sublime-test:
	./node_modules/.bin/buster-test --reporter specification -g "main" --color=none

riak-test:
	./node_modules/.bin/buster-test --reporter specification -g "riak" --color=none

express-test:
	./node_modules/.bin/buster-test --reporter specification -g "express" --color=none