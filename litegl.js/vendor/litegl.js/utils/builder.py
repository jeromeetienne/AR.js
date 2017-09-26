#!/usr/bin/python

import re, os, sys, time, tempfile, shutil
import argparse
from datetime import date

compiler_path = "/usr/local/bin/compiler.jar"
compiler_flags = "--language_in=ECMASCRIPT5_STRICT"
root_path = "./"

#arguments
parser = argparse.ArgumentParser(description='Deploy a JS app creating a minifyed version checking for errors.')
parser.add_argument('input_file', 
                   help='the path to the file with a list of all the JS files')

parser.add_argument('-o', dest='output_file', action='store',
                   default=None,
                   help='Specify an output for the minifyed version')

parser.add_argument('-o2', dest='fullcode_output_file', action='store',
                   default=None,
                   help='Specify an output for the full code version')

#parser.add_argument('output_file', 
#                   help='the filename where to save the min version')

parser.add_argument('--all', dest='all_files', action='store_const',
                   const=True, default=False,
                   help='Compile all JS files individually first.')
parser.add_argument('--nomin', dest='no_minify', action='store_const',
                   const=True, default=False,
                   help='Do not minify the JS file')

args = parser.parse_args()

check_files_individually = args.all_files
output_file = args.output_file
fullcode_output_file = args.fullcode_output_file
no_minify = args.no_minify

root_path = "./" + os.path.dirname(args.input_file) + "/"
sys.stderr.write(" + Root folder: " + root_path + "\n")

def packJSCode(files):
    f1, fullcode_path = tempfile.mkstemp() #create temporary file
    data = "//packer version\n"
    
    for filename in files:
        filename = filename.strip()
        if len(filename) == 0 or filename[0] == "#":
            continue
        sys.stderr.write(" + Processing... " + filename + " " )
        src_file = root_path + filename
        if os.path.exists(src_file) == False:
            sys.stderr.write('\033[91m'+"JS File not found"+'\033[0m\n')
            continue
        data += open(src_file).read() + "\n"
        if check_files_individually:
              os.system("java -jar %s %s --js %s --js_output_file %s" % (compiler_path, compiler_flags, src_file, "temp.js") )
        sys.stderr.write('\033[92m' + "OK\n" + '\033[0m')
    
    os.write(f1,data)
    os.close(f1)
    
    #print " + Compiling all..."
    #os.system("java -jar %s --js %s --js_output_file %s" % (compiler_path, fullcode_path, output_file) )
    #print " * Done"
    return fullcode_path

def compileAndMinify(input_path, output_path):
    print " + Compiling and minifying..."
    if output_path != None:
        os.system("java -jar %s %s --js %s --js_output_file %s" % (compiler_path, compiler_flags, input_path, output_path) )
        sys.stderr.write(" * Stored in " + output_path + "\n");
    else:
        os.system("java -jar %s --js %s" % (compiler_path, input_path) )

#load project info
if os.path.exists(args.input_file) == False:
    sys.stderr.write("\033[91m Error, input file not found: " + args.input_file + "\033[0m\n")
    exit(0)

js_files = open(args.input_file).read().splitlines()

fullcode_path = packJSCode(js_files)

if fullcode_output_file != None:
    shutil.copy2(fullcode_path, fullcode_output_file)
    sys.stderr.write(" * Fullcode Stored in " + fullcode_output_file + "\n");

if not no_minify:
    compileAndMinify( fullcode_path, output_file )
