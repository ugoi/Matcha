import { describe, expect, test, vi } from "vitest";
// const request = require('supertest');
// const should = require('should');
// const express = require('express');
// const cookieParser = require('cookie-parser');

import request from "supertest";
import express from "express";
import cookieParser from "cookie-parser";

describe('request.agent(app)', function() {
  const app = express();
  app.use(cookieParser());

  app.get('/', function(req, res) {
    res.cookie('cookie', 'hey');
    res.send();
  });

  app.get('/return', function(req, res) {
    if (req.cookies.cookie) res.send(req.cookies.cookie);
    else res.send(':(')
  });

  const agent = request.agent(app);

  test('should save cookies', function(done) {
    agent
    .get('/')
    .expect('set-cookie', 'cookie=hey; Path=/', done);
  });

  test('should send cookies', function(done) {
    agent
    .get('/return')
    .expect('hey', done);
  });
});
