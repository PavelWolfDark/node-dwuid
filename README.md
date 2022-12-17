# Darkwolf UID (DWUID)
Darkwolf UID (DWUID) — universally unique lexicographic human-friendly decentralized identifier.

## Installation
```sh
npm i dwuid 
```

## Usage
```ts
import {
  Uid,
  TimestampUid,
  RandomUid,
  GeohashUid,
  TimestampUidGenerator,
  RandomUidGenerator
} from 'dwuid';

console.log(`${Uid.timestamp()}`); // => 4arZkrd5dFjDAxGo2EcMM
console.log(`${Uid.parse(
    '4arZkrd5dFjDAxGo2EcMM')}`); // => TimestampUid(4arZkrd5dFjDAxGo2EcMM)

console.log(`${Uid.random()}`); // => 5LsB98o4MByiNMWV8cxni
console.log(`${Uid.parse(
    '5LsB98o4MByiNMWV8cxni')}`); // => RandomUid(5LsB98o4MByiNMWV8cxni)

console.log(`${Uid.geohash(0.123456, 0.123456)}`); // => 2oHjQuePNCD
console.log(`${Uid.parse('2oHjQuePNCD')}`); // => GeohashUid(2oHjQuePNCD)

console.log(`${TimestampUid.now()}`); // => Jbbq9G615
console.log(`${TimestampUid.parse('Jbbq9G615')}`); // => Jbbq9G615
console.log(`${TimestampUid.tryParse('Jbbq9G615')}`); // => Jbbq9G615
// console.log(`${RandomUid.parse('Jbbq9G615')}`); // throws RangeError
console.log(`${RandomUid.tryParse('Jbbq9G615')}`); // => null

console.log(`${GeohashUid.fromCoordinates(-45.123456, -90.123456)}`); // => 2gctpGXKR4c
console.log(`${GeohashUid.fromCoordinates(45.123456, 90.123456)}`); // => 2q7EUgg3MZF
console.log(`${GeohashUid.parse('2gctpGXKR4c')
    .toLocation()}`); // => Location(-45.123456, -90.123456)
console.log(`${GeohashUid.parse('2q7EUgg3MZF')
    .toLocation()}`); // => Location(45.123456, 90.123456)

const timestampUidGenerator = new TimestampUidGenerator();
console.log(`${timestampUidGenerator.next()}`); // => 4arZkrd5gj9ndREUza23a
console.log(`${timestampUidGenerator.next()}`); // => 4arZkrd5gv5Gan2fDe7w3
console.log(`${timestampUidGenerator.next()}`); // => 4arZkrd5gv5Gan2fDe7w4
console.log(`${timestampUidGenerator.next()}`); // => 4arZkrd5h8pqZmCarCpyb
console.log(`${timestampUidGenerator.next()}`); // => 4arZkrd5h8pqZmCarCpyc

const randomUidGenerator = new RandomUidGenerator();
// const secureRandomUidGenerator = new RandomUidGenerator({
//   secureRandom: true
// });
console.log(`${randomUidGenerator.next()}`); // => 56cuNWELu2ZEqeo7QCfLn
console.log(`${randomUidGenerator.next()}`); // => 5Td5b6CEySZJGFZ6CA2iW
console.log(`${randomUidGenerator.next()}`); // => 59zXzHMpg1QRb57zJVGsQ
console.log(`${randomUidGenerator.next()}`); // => 5EraHXGw21VpRhWTUYoCa
console.log(`${randomUidGenerator.next()}`); // => 5StxyheEN6wDoM3pfsBEP
```