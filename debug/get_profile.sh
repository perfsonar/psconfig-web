#!/bin/bash

token="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJpYXQiOjE0MTY5MjkwNjEsImp0aSI6IjgwMjA1N2ZmOWI1YjRlYjdmYmI4ODU2YjZlYjJjYzViIiwic2NvcGVzIjp7ImNvbW1vbiI6WyJ1c2VyIl0sImlzZHAiOnsiYWN0aW9ucyI6WyJyZXF1ZXN0Il19fX0.g0HC5MB2LhfFUpjHfnddu5nSvhSb8XKvcbY39deQxEztz8iu6kTaowqcmFuRYBUUPpPg5W8W2lH3Q6gNYX64qnB_0z3E8lP6kDO1OoHNqqQs_jbzC63tdzUsmdyfeof1JkzHjORc8QXl_3iaMH24A3ME-qmuay-B7MmHVJ1GKfg"

curl -H "Accept: application/json" \
    -H "Content-type: application/json" \
    -H "Authorization: Bearer $token" \
    -X GET http://localhost:12402/public

