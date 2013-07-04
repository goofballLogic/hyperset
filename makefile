all = test auto-test sublime-test riak-test express-test

.PHONY: $(all)

test:
	./node_modules/.bin/buster-test

test-dot:
	./node_modules/.bin/buster-test

auto-test:
	./node_modules/.bin/buster-autotest --reporter specification

sublime-test:
	./node_modules/.bin/buster-test -g "main" --color=none
