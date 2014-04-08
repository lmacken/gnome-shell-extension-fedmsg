#!/bin/bash -x
VERSION=0.1.7
REV=1
DIST=fc20
#rpmdev-bumpspec ~/rpmbuild/SPECS/gnome-shell-extension-fedmsg.spec
pushd ..
cp -R gnome-shell-extension-fedmsg{,-$VERSION}
tar --exclude=.git -czf gnome-shell-extension-fedmsg-$VERSION.tar.gz gnome-shell-extension-fedmsg-$VERSION/
mv *.gz ~/rpmbuild/SOURCES/
rm -fr gnome-shell-extension-fedmsg-$VERSION
rpmbuild -ba ~/rpmbuild/SPECS/gnome-shell-extension-fedmsg.spec
sudo rpm -e gnome-shell-extension-fedmsg
sudo rpm -ivh /home/lmacken/rpmbuild/RPMS/noarch/gnome-shell-extension-fedmsg-$VERSION-$REV.$DIST.noarch.rpm
popd
