PACKAGE=perfsonar-psconfig-web-admin-ui
ROOTPATH=/usr/lib/perfsonar/psconfig-web-admin-ui
CONFIGPATH=${ROOTPATH}/etc
#LIBPATH=/usr/lib/perfsonar/lib
#GRAPHLIBPATH=/usr/lib/perfsonar/psconfig-web/lib
PERFSONAR_AUTO_VERSION=4.1.6
PERFSONAR_AUTO_RELNUM=1
VERSION=${PERFSONAR_AUTO_VERSION}
RELEASE=${PERFSONAR_AUTO_RELNUM}

default:
	@echo No need to build the package. Just run \"make install\"

dist:
	mkdir /tmp/$(PACKAGE)-$(VERSION).$(RELEASE)
	tar ch -T MANIFEST | tar x -C /tmp/$(PACKAGE)-$(VERSION).$(RELEASE)
	tar czf $(PACKAGE)-$(VERSION).$(RELEASE).tar.gz -C /tmp $(PACKAGE)-$(VERSION).$(RELEASE)
	rm -rf /tmp/$(PACKAGE)-$(VERSION).$(RELEASE)
	cp $(PACKAGE)-$(VERSION).$(RELEASE).tar.gz ~/rpmbuild/SOURCES/

npm:
	#cd ui; npm install --production
	pushd ui; npm install --only=prod; popd

webpack:
	./ui/node_modules/webpack/bin/webpack.js ui/js/app.js -o ui/dist/pwa-admin-ui-bundle.js

install:
	mkdir -p ${ROOTPATH}
	tar ch --exclude=etc/* --exclude=*spec --exclude=dependencies --exclude=MANIFEST --exclude=LICENSE --exclude=Makefile -T MANIFEST | tar x -C ${ROOTPATH}
	for i in `cat MANIFEST | grep ^etc/ | sed "s/^etc\///"`; do  mkdir -p `dirname $(CONFIGPATH)/$${i}`; if [ -e $(CONFIGPATH)/$${i} ]; then install -m 640 -c etc/$${i} $(CONFIGPATH)/$${i}.new; else install -m 640 -c etc/$${i} $(CONFIGPATH)/$${i}; fi; done
	#sed -i 's:.RealBin/\.\./lib:${LIBPATH}:g' ${ROOTPATH}/cgi-bin/*
	#sed -i 's:.RealBin/lib:${GRAPHLIBPATH}:g' ${ROOTPATH}/cgi-bin/*

rpm:
	admin pub

admin:
	rpmbuild -bs perfsonar-psconfig-web-admin-ui.spec
	rpmbuild -ba perfsonar-psconfig-web-admin-ui.spec

pub:
	rpmbuild -bs perfsonar-psconfig-web-pub.spec
	rpmbuild -ba perfsonar-psconfig-web-pub.spec

clean:
	rm -f perfsonar-psconfig*.tar.gz
	rm -rf ~/rpmbuild/RPMS/* ~/rpmbuild/BUILD/* ~/rpmbuild/BUILDROOT/* ~/rpmbuild/SOURCES/* ~/rpmbuild/SRPMS ~/rpmbuild/SPECS
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
