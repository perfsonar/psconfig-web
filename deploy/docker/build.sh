
#docker needs everything to be under cwd for copy to file
rm -rf _common
rm -rf _conf
cp -r ../common _common
cp -r ../conf _conf

docker build --no-cache -t soichih/mca .
