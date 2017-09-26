cd "$(dirname "$0")"
python builder.py deploy_files.txt -o ../build/litegl.min.js -o2 ../build/litegl.js
chmod a+rw ../build/* 
