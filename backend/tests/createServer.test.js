const fs = require('fs');
const http = require('http');
const https = require('https');
const express = require('express');
const { createServer, isHttpsEnabled } = require('../src/config/createServer');

describe('isHttpsEnabled', () => {
  test.each([
    [undefined, true],
    ['', true],
    ['true', true],
    ['anything-else', true],
    ['false', false],
    ['FALSE', false],
    [' False ', false],
  ])('USE_HTTPS=%j gives %s', (value, expected) => {
    expect(isHttpsEnabled(value)).toBe(expected);
  });
});

describe('createServer', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('with USE_HTTPS=false it serves plain HTTP and needs no certificates', () => {
    const readSpy = jest.spyOn(fs, 'readFileSync');
    const server = createServer(express(), false);

    expect(server).toBeInstanceOf(http.Server);
    expect(server).not.toBeInstanceOf(https.Server);
    expect(readSpy).not.toHaveBeenCalled();
  });

  test('with HTTPS on it loads the certificates and fails clearly when they are missing', () => {
    // Only the certificate files are made to "go missing". Every other file read
    // (for example by Jest itself) keeps working, or the test runner can break on Windows.
    const realReadFileSync = fs.readFileSync;
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation((path, ...args) => {
      if (String(path).includes('certs')) {
        throw new Error('ENOENT: no such file or directory');
      }
      // The path is passed straight through to the real function, unchanged
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      return realReadFileSync(path, ...args);
    });

    expect(() => createServer(express(), true)).toThrow(/ENOENT/);
    expect(readSpy).toHaveBeenCalledWith('./certs/localhost-key.pem');
  });
});