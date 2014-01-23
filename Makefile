SHELL := /bin/bash -O extglob

dist:
	cat vendor/*.js src/cute.js src/!(cute).js src/**/*.js > dist.js
