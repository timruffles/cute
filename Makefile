SHELL := /bin/bash -O extglob

build:
	cat vendor/*.js src/cute.js src/!(cute).js src/**/*.js > dist.js

PSEUDO: dist

dist:
	cat vendor/*.js src/cute.js src/!(cute).js src/**/*.js | uglifyjs > dist.min.js

