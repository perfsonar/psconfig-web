#!/bin/bash
node /app/bin/auth.js issue --scopes '{"common":["user"]}' --sub sca --out user.jwt
