PACKAGE=perfsonar-psconfig-web-admin-shared
UI_PACKAGE=perfsonar-psconfig-web-admin-ui
PUB_PACKAGE=perfsonar-psconfig-web-admin-publisher
ROOTPATH=/usr/lib/perfsonar/psconfig-web-admin-ui
UI_ROOTPATH=/usr/lib/perfsonar/psconfig-web-admin-ui
PUB_ROOTPATH=/usr/lib/perfsonar/psconfig-web-admin/pub
CONFIGPATH=${ROOTPATH}/etc
PUB_CONFIGPATH=${PUB_ROOTPATH}/etc
#LIBPATH=/usr/lib/perfsonar/lib
#GRAPHLIBPATH=/usr/lib/perfsonar/psconfig-web/lib
PERFSONAR_AUTO_VERSION=4.1.6
PERFSONAR_AUTO_RELNUM=1
VERSION=${PERFSONAR_AUTO_VERSION}
RELEASE=${PERFSONAR_AUTO_RELNUM}

default:
	@echo No need to build the package. Just run \"make install\"

dist:
	#make manifest
	mkdir /tmp/$(PACKAGE)-$(VERSION).$(RELEASE)
	tar ch -T MANIFEST -T MANIFEST-node_modules | tar x -C /tmp/$(PACKAGE)-$(VERSION).$(RELEASE)
	tar czf $(PACKAGE)-$(VERSION).$(RELEASE).tar.gz -C /tmp $(PACKAGE)-$(VERSION).$(RELEASE)
	rm -rf /tmp/$(PACKAGE)-$(VERSION).$(RELEASE)
	cp $(PACKAGE)-$(VERSION).$(RELEASE).tar.gz ~/rpmbuild/SOURCES/
	## UI Package
	mkdir /tmp/$(UI_PACKAGE)-$(VERSION).$(RELEASE)
	tar ch -T MANIFEST-ui -T MANIFEST-ui-node_modules | tar x -C /tmp/$(UI_PACKAGE)-$(VERSION).$(RELEASE)
	tar czf $(UI_PACKAGE)-$(VERSION).$(RELEASE).tar.gz -C /tmp $(UI_PACKAGE)-$(VERSION).$(RELEASE)
	rm -rf /tmp/$(UI_PACKAGE)-$(VERSION).$(RELEASE)
	cp $(UI_PACKAGE)-$(VERSION).$(RELEASE).tar.gz ~/rpmbuild/SOURCES/
	## PUB PACKAGE
	mkdir /tmp/$(PUB_PACKAGE)-$(VERSION).$(RELEASE)
	tar ch -T MANIFEST-pub | tar x -C /tmp/$(PUB_PACKAGE)-$(VERSION).$(RELEASE)
	tar czf $(PUB_PACKAGE)-$(VERSION).$(RELEASE).tar.gz -C /tmp $(PUB_PACKAGE)-$(VERSION).$(RELEASE)
	rm -rf /tmp/$(PUB_PACKAGE)-$(VERSION).$(RELEASE)
	cp $(PUB_PACKAGE)-$(VERSION).$(RELEASE).tar.gz ~/rpmbuild/SOURCES/

manifest:
	find node_modules -type f > MANIFEST-node_modules
	# add UI node modules, ignoring a few large folders. optimize this later
	find ui/node_modules -type f | grep -v bootswatch/docs | grep -v ace-builds > MANIFEST-ui-node_modules
	# specifically include the minimized "ace" build
	echo "ui/node_modules/ace-builds/src-min-noconflict/ace.js" >> MANIFEST-ui-node_modules

npm:
	#cd ui; npm install --production
	npm install --only=prod
	pushd ui; npm install --only=prod; popd

webpack:
	./ui/node_modules/webpack/bin/webpack.js ui/js/app.js -o ui/dist/pwa-admin-ui-bundle.js

install:
	mkdir -p ${ROOTPATH}
	tar ch --exclude=etc/* --exclude=*spec --exclude=dependencies --exclude=MANIFEST --exclude=LICENSE --exclude=Makefile -T MANIFEST | tar x -C ${ROOTPATH}
	for i in `cat MANIFEST | grep ^etc/ | sed "s/^etc\///"`; do  mkdir -p `dirname $(CONFIGPATH)/$${i}`; if [ -e $(CONFIGPATH)/$${i} ]; then install -m 640 -c etc/$${i} $(CONFIGPATH)/$${i}.new; else install -m 640 -c etc/$${i} $(CONFIGPATH)/$${i}; fi; done
	#sed -i 's:.RealBin/\.\./lib:${LIBPATH}:g' ${ROOTPATH}/cgi-bin/*
	#sed -i 's:.RealBin/lib:${GRAPHLIBPATH}:g' ${ROOTPATH}/cgi-bin/*

#	# PUB PACKAGE
install_pub:
	#mkdir -p ${PUB_ROOTPATH}
	tar ch --exclude=etc/* --exclude=*spec --exclude=dependencies --exclude=MANIFEST-pub --exclude=LICENSE --exclude=Makefile -T MANIFEST-pub | tar x -C ${PUB_ROOTPATH}
	for i in `cat MANIFEST-pub | grep ^etc/ | sed "s/^etc\///"`; do  mkdir -p `dirname $(PUB_CONFIGPATH)/$${i}`; if [ -e $(PUB_CONFIGPATH)/$${i} ]; then install -m 640 -c etc/$${i} $(PUB_CONFIGPATH)/$${i}.new; else install -m 640 -c etc/$${i} $(PUB_CONFIGPATH)/$${i}; fi; done
	
rpm:
	make admin
	make pub

shared:
	rpmbuild -bs perfsonar-psconfig-web-admin-shared.spec
	rpmbuild -ba perfsonar-psconfig-web-admin-shared.spec

admin:
	rpmbuild -bs perfsonar-psconfig-web-admin-ui.spec
	rpmbuild -ba perfsonar-psconfig-web-admin-ui.spec

pub:
	rpmbuild -bs perfsonar-psconfig-web-admin-publisher.spec
	rpmbuild -ba perfsonar-psconfig-web-admin-publisher.spec

clean:
	rm -f perfsonar-psconfig*.tar.gz
	rm -rf ~/rpmbuild/RPMS/* ~/rpmbuild/BUILD/* ~/rpmbuild/BUILDROOT/* ~/rpmbuild/SOURCES/* ~/rpmbuild/SRPMS ~/rpmbuild/SPECS
	#rm -f MANIFEST-node_modules
	#rm -rf node_modules
	#rm -rf ui/node_modules
	#rm -f ui/dist/pwa-admin-ui-bundle.js

# These tests will have to be done differently, since this project uses nodejs instead of perl

#test:
#	    PERL_DL_NONLAZY=1 /usr/bin/perl "-MExtUtils::Command::MM" "-e" "test_harness(0)" t/*.t

#cover:
#	    cover -test

#test_jenkins:
#	    mkdir -p tap_output
#		    PERL5OPT=-MDevel::Cover prove t/ --archive tap_output/
