#!/usr/bin/env node

"use strict";

const program = require('commander');
const zlib = require('zlib');
const path = require('path');
const fs = require('fs');
const streamIf = require('ternary-stream');
var tar = require('tar');
var unzip = require('unzip');

program
    .version('0.1.0')
    .option('-f --file [filename]', 'The file to act on.')
    .option('-i --incoming', 'Tells zipper to expect an incoming file stream.')
    .option('-s --stream', 'Tells zipper to stream output to stdout.')
    .option('-z --zip', 'Tells zipper to zip the file or stream coming in.')
    .option('-u --unzip', 'Tells zipper to unzip the file or stream coming in.')
    .option('-e --extract', 'Tells zipper to extract file or stream from a tar.')
    .option('-t --tar', 'Tells zipper to package file or stream as a tar.')
    .option('-g --gzip', 'Tells zipper to gzip the file or stream coming in.')
    .option('-x --gunzip', 'Tells zipper to gunzip the file or stream coming in.')
    .option('-d --destination [dest]', 'The directory to output the file to.')
    .parse(process.argv);

let ins,out,p,c,d,i,s,dest;

s = (program.stream) ? true : false;
i = (program.incoming) ? true : false;
c = (program.zip || program.tar || program.gzip) ? true : false;
d = (program.unzip || program.extract || program.gunzip);
dest = (program.destination) ? program.destination : '';

if(!i && !program.file) {
    console.log('Please specify a file or stream to work on. See --help for more info.');
    process.exit(1);
}

ins = (i) ? process.stdin : fs.createReadStream(program.file);

if(c) {
    ins
        .pipe(streamIf(program.tar, tar.Pack()))
        .pipe(streamIf(program.gzip, zlib.createGzip()))
        .pipe(streamIf(s, process.stdout))
        .pipe(streamIf(dest, fs.createWriteStream(dest)));
} else {
    ins
        .pipe(streamIf(program.gunzip, zlib.createGunzip()))
        .pipe(streamIf(program.extract, tar.extract({path:  dest})))
        .pipe(streamIf(program.unzip, unzip.Extract({ path: dest})))
        .pipe(streamIf(s, process.stdout))
        .pipe(streamIf(dest, fs.createWriteStream(dest)));
}