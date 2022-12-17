import {
  randomInt as cryptoRandomInt
} from 'crypto';

const timestampUidInitialValue = 0x8000000000000n;
const uniqueTimestampUidInitialValue = 0x800000000000000000000000000000n;
const maxUniqueTimestampUidValue = 0xFFFFFFFFFFFFFFFFFn;
const randomUidInitialValue = 0x900000000000000000000000000000n;
const geohashUidInitialValue = 0xA00000000000000n;
const uidValues = new WeakMap<Uid, bigint>();

export enum UidEncoding {
  base58 = 'base58',
  base64 = 'base64'
}

const createBaseEncodingMap = (alphabet: string): Map<bigint, string> => {
  const base = alphabet.length;
  const encodingMap = new Map<bigint, string>();
  for (let i = 0; i < base; i++) {
    const charIndex = BigInt(i);
    const char = alphabet[i];
    encodingMap.set(charIndex, char);
  }
  return encodingMap;
}

const createBaseDecodingMap = (
  alphabet: string,
  alternatives?: { [char: string]: string[] }
): Map<string, bigint> => {
  const base = alphabet.length;
  const decodingMap = new Map<string, bigint>();
  for (let i = 0; i < base; i++) {
    const charIndex = BigInt(i);
    const char = alphabet[i];
    decodingMap.set(char, charIndex);
    if (alternatives != null && Object.hasOwn(alternatives, char)) {
      const alternativeChars = alternatives[char];
      for (const alternativeChar of alternativeChars) {
        decodingMap.set(alternativeChar, charIndex);
      }
    }
  }
  return decodingMap;
}

class Base58 {
  private static readonly alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  private static readonly encodingMap = createBaseEncodingMap(this.alphabet);
  private static readonly decodingMap = createBaseDecodingMap(this.alphabet, {
    '1': ['I', 'l'],
    'o': ['0', 'O']
  });

  static encodeBigInt(value: bigint): string {
    let string = '';
    while (value > 0n) {
      const charIndex = value % 58n;
      const char = this.encodingMap.get(charIndex);
      string = `${char}${string}`;
      value /= 58n;
    }
    return string;
  }

  static decodeBigInt(source: string): bigint {
    const length = source.length;
    let value = 0n;
    for (let i = 0; i < length; i++) {
      const char = source[i];
      const charIndex = this.decodingMap.get(char);
      if (charIndex == null) {
        throw new SyntaxError(`Invalid Base58 character at index ${i}: ${source}`);
      }
      value = (value * 58n) + charIndex;
    }
    return value;
  }
}

class Base64 {
  private static readonly alphabet = '-0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz';
  private static readonly encodingMap = createBaseEncodingMap(this.alphabet);
  private static readonly decodingMap = createBaseDecodingMap(this.alphabet);

  static encodeBigInt(value: bigint): string {
    let string = '';
    while (value > 0n) {
      const charIndex = value % 64n;
      const char = this.encodingMap.get(charIndex);
      string = `${char}${string}`;
      value /= 64n;
    }
    return string;
  }

  static decodeBigInt(source: string): bigint {
    const length = source.length;
    let value = 0n;
    for (let i = 0; i < length; i++) {
      const char = source[i];
      const charIndex = this.decodingMap.get(char);
      if (charIndex == null) {
        throw new SyntaxError(`Invalid Base64 character at index ${i}: ${source}`);
      }
      value = (value * 64n) + charIndex;
    }
    return value;
  }
}

const bigIntBitLength = (value: bigint): number => value.toString(2).length;

const bytesToBigInt = (bytes: Uint8Array): bigint => {
  let value = 0n;
  for (const byte of bytes) {
    value = (value << 8n) | BigInt(byte);
  }
  return value;
}

const bigIntToBytes = (value: bigint): Uint8Array => {
  const bitLength = bigIntBitLength(value);
  const length = (bitLength + 7) >> 3;
  const bytes = new Uint8Array(length);
  let offset = length - 1;
  while (offset >= 0) {
    bytes[offset--] = Number(value % 256n);
    value >>= 8n;
  }
  return bytes;
}

const mathRandomInt = (max: number): number => {
  const random = Math.random();
  return Math.floor(random * max);
}

const randomBigInt = (bits: number): bigint => {
  let value = 0n;
  let shift = 53;
  let shiftBigInt = 53n;
  let max = Number.MAX_SAFE_INTEGER;
  while (bits > 0) {
    if (bits < shift) {
      shift = bits;
      shiftBigInt = BigInt(bits);
      max = (2 ** bits) - 1;
    }
    const randomInt = mathRandomInt(max);
    value = (value << shiftBigInt) + BigInt(randomInt);
    bits -= shift;
  }
  return value;
}

const secureRandomBigInt = (bits: number): bigint => {
  let value = 0n;
  let shift = 48;
  let shiftBigInt = 48n;
  let max = 0xFFFFFFFFFFFF;
  while (bits > 0) {
    if (bits < shift) {
      shift = bits;
      shiftBigInt = BigInt(bits);
      max = (2 ** bits) - 1;
    }
    const randomInt = cryptoRandomInt(max);
    value = (value << shiftBigInt) + BigInt(randomInt);
    bits -= shift;
  }
  return value;
}

const createTimestampUid = (value: bigint): TimestampUid => {
  const timestampUid: TimestampUid = Object.create(TimestampUid.prototype);
  uidValues.set(timestampUid, value);
  return timestampUid;
}

const createRandomUid = (value: bigint): RandomUid => {
  const randomUid: RandomUid = Object.create(RandomUid.prototype);
  uidValues.set(randomUid, value);
  return randomUid;
}

const createGeohashUid = (value: bigint): GeohashUid => {
  const geohashUid: GeohashUid = Object.create(GeohashUid.prototype);
  uidValues.set(geohashUid, value);
  return geohashUid;
}

const degreesInRadians = (degrees: number): number => degrees * Math.PI / 180;

const uidVersion = (value: bigint, bitLength: number): number => {
  const versionValue = value >> BigInt(bitLength - 4);
  return (Number(versionValue) & 7) + 1;
}

const thisUidValue = (uid: Uid): bigint => {
  const value = uidValues.get(uid);
  if (!value) {
    throw new TypeError(`'this' is not an instance of Uid`);
  }
  return value;
}

export class Location {
  readonly #latitude: number;
  readonly #longitude: number;

  constructor(latitude: number, longitude: number) {
    this.#latitude = latitude;
    this.#longitude = longitude;
  }

  get latitude(): number {
    return this.#latitude;
  }

  get longitude(): number {
    return this.#longitude;
  }

  equals(other: any): boolean {
    return other instanceof Location &&
      this.#latitude === other.#latitude &&
      this.#longitude === other.#longitude;
  }

  distanceTo(other: Location): number {
    const latitude = this.#latitude;
    const longitude = this.#longitude;
    const otherLatitude = other.#latitude;
    const otherLongitude = other.#longitude;
    const lat1 = degreesInRadians(latitude);
    const lat2 = degreesInRadians(otherLatitude);
    const dLat = degreesInRadians(otherLatitude - latitude);
    const dLon = degreesInRadians(otherLongitude - longitude);
    return 12742000 * Math.asin(Math.sqrt(Math.pow(Math.sin(dLat / 2), 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(dLon / 2), 2)));
  }
}

export class BoundingBox {
  readonly #minLatitude: number;
  readonly #minLongitude: number;
  readonly #maxLatitude: number;
  readonly #maxLongitude: number;

  constructor(
    minLatitude: number,
    minLongitude: number,
    maxLatitude: number,
    maxLongitude: number
  ) {
    this.#minLatitude = minLatitude;
    this.#minLongitude = minLongitude;
    this.#maxLatitude = maxLatitude;
    this.#maxLongitude = maxLongitude;
  }

  get minLatitude(): number {
    return this.#minLatitude;
  }

  get minLongitude(): number {
    return this.#minLongitude;
  }

  get maxLatitude(): number {
    return this.#maxLatitude;
  }

  get maxLongitude(): number {
    return this.#maxLongitude;
  }

  equals(other: any): boolean {
    return other instanceof BoundingBox &&
      this.#minLatitude === other.#minLatitude &&
      this.#minLongitude === other.#minLongitude &&
      this.#maxLatitude === other.#maxLatitude &&
      this.#maxLongitude === other.#maxLongitude;
  }
}

class Geohash {
  static encode(latitude: number, longitude: number): bigint {
    let geohash = 0n;
    let minLatitude = -90;
    let minLongitude = -180;
    let maxLatitude = 90;
    let maxLongitude = 180;
    let isEvenBit = true;
    for (let i = 0; i < 56; i++) {
      geohash <<= 1n;
      if (isEvenBit) {
        const deltaLongitude = (minLongitude + maxLongitude) / 2;
        if (longitude > deltaLongitude) {
          geohash++;
          minLongitude = deltaLongitude;
        } else {
          maxLongitude = deltaLongitude;
        }
      } else {
        const deltaLatitude = (minLatitude + maxLatitude) / 2;
        if (latitude > deltaLatitude) {
          geohash++;
          minLatitude = deltaLatitude;
        } else {
          maxLatitude = deltaLatitude;
        }
      }
      isEvenBit = !isEvenBit;
    }
    return geohash;
  }

  static decode(geohash: bigint): BoundingBox {
    let minLatitude = -90;
    let minLongitude = -180;
    let maxLatitude = 90;
    let maxLongitude = 180;
    let isEvenBit = true;
    for (let i = 55; i >= 0; i--) {
      const bit = (geohash >> BigInt(i)) & 1n;
      if (isEvenBit) {
        const deltaLongitude = (minLongitude + maxLongitude) / 2;
        if (bit) {
          minLongitude = deltaLongitude;
        } else {
          maxLongitude = deltaLongitude;
        }
      } else {
        const deltaLatitude = (minLatitude + maxLatitude) / 2;
        if (bit) {
          minLatitude = deltaLatitude;
        } else {
          maxLatitude = deltaLatitude;
        }
      }
      isEvenBit = !isEvenBit;
    }
    return new BoundingBox(minLatitude, minLongitude, maxLatitude, maxLongitude);
  }
}

export interface UidGenerator {
  next(): Uid;
}

export class TimestampUidGenerator implements UidGenerator {
  readonly #uniqueBits: number;
  readonly #uniqueBitsBigInt: bigint;
  readonly #initialValue: bigint;
  readonly #maxUniqueValue: bigint;
  readonly #random: (bits: number) => bigint;
  #lastTimestamp: number = 0;
  #timestampValue: bigint = 0n;
  #uniqueValue: bigint = 0n;

  constructor(options?: {
    bits?: number;
    secureRandom?: boolean;
  }) {
    if (options) {
      const bits = options.bits;
      if (bits != null && bits != 120) {
        if (!Number.isInteger(bits)) {
          throw new TypeError(`bits is not an integer: ${bits}`);
        }
        if (bits < 60) {
          throw new RangeError(`bits must be greater than or equal to 60: ${bits}`);
        }
        const uniqueBits = bits - 52;
        this.#uniqueBits = uniqueBits;
        const uniqueBitsBigInt = BigInt(uniqueBits);
        this.#uniqueBitsBigInt = uniqueBitsBigInt;
        this.#initialValue = 8n << uniqueBitsBigInt;
        this.#maxUniqueValue = (1n << uniqueBitsBigInt) - 1n;
      } else {
        this.#uniqueBits = 68;
        this.#uniqueBitsBigInt = 68n;
        this.#initialValue = uniqueTimestampUidInitialValue;
        this.#maxUniqueValue = maxUniqueTimestampUidValue;
      }
      this.#random = options.secureRandom ? secureRandomBigInt : randomBigInt;
    } else {
      this.#uniqueBits = 68;
      this.#uniqueBitsBigInt = 68n;
      this.#initialValue = uniqueTimestampUidInitialValue;
      this.#maxUniqueValue = maxUniqueTimestampUidValue;
      this.#random = randomBigInt;
    }
  }

  next(): TimestampUid {
    let value: bigint;
    const timestamp = Date.now();
    if (timestamp != this.#lastTimestamp) {
      this.#lastTimestamp = timestamp;
      const timestampValue =
        this.#initialValue + (BigInt(timestamp) << this.#uniqueBitsBigInt);
      this.#timestampValue = timestampValue;
      const uniqueValue = this.#random(this.#uniqueBits);
      this.#uniqueValue = uniqueValue;
      value = timestampValue + uniqueValue;
    } else {
      let uniqueValue = this.#uniqueValue + 1n;
      if (uniqueValue > this.#maxUniqueValue) {
        uniqueValue = 0n;
      }
      this.#uniqueValue = uniqueValue;
      value = this.#timestampValue + uniqueValue;
    }
    return createTimestampUid(value);
  }
}

export class RandomUidGenerator implements UidGenerator {
  readonly #randomBits: number;
  readonly #initialValue: bigint;
  readonly #random: (bits: number) => bigint;

  constructor(options?: {
    bits?: number;
    secureRandom?: boolean;
  }) {
    if (options) {
      const bits = options.bits;
      if (bits != null && bits != 120) {
        if (!Number.isInteger(bits)) {
          throw new TypeError(`bits is not an integer: ${bits}`);
        }
        if (bits < 24) {
          throw new RangeError(`bits must be greater than or equal to 24: ${bits}`);
        }
        const randomBits = bits - 4;
        this.#randomBits = randomBits;
        this.#initialValue = 9n << BigInt(randomBits);
      } else {
        this.#randomBits = 116;
        this.#initialValue = randomUidInitialValue;
      }
      this.#random = options.secureRandom ? secureRandomBigInt : randomBigInt;
    } else {
      this.#randomBits = 116;
      this.#initialValue = randomUidInitialValue;
      this.#random = randomBigInt;
    }
  }

  next(): RandomUid {
    const value = this.#initialValue + this.#random(this.#randomBits);
    return createRandomUid(value);
  }
}

export class Uid {
  static #timestampUidGenerator = new TimestampUidGenerator();
  static #randomUidGenerator = new RandomUidGenerator();

  static timestamp(): TimestampUid {
    return this.#timestampUidGenerator.next();
  }

  static random(): RandomUid {
    return this.#randomUidGenerator.next();
  }

  static geohash(latitude: number, longitude: number): GeohashUid {
    return GeohashUid.fromCoordinates(latitude, longitude);
  }

  static parse(
    source: string,
    encoding: UidEncoding = UidEncoding.base58
  ): Uid {
    const length = source.length;
    if (length < 4) {
      throw new RangeError(`Invalid UID length: ${length}`);
    }
    const value = encoding === UidEncoding.base64
      ? Base64.decodeBigInt(source)
      : Base58.decodeBigInt(source);
    return this.fromBigInt(value);
  }

  static tryParse(
    source: string,
    encoding: UidEncoding = UidEncoding.base58
  ): Uid | null {
    try {
      return this.parse(source, encoding);
    } catch (error) {
      return null;
    }
  }

  static fromBigInt(value: bigint): Uid {
    const bitLength = bigIntBitLength(value);
    if (bitLength < 24) {
      throw new RangeError(`Invalid UID bit length: ${bitLength}`);
    }
    const version = uidVersion(value, bitLength);
    switch (version) {
      case 1:
        if (bitLength < 60 && bitLength != 52) {
          throw new RangeError(`Invalid TimestampUID bit length: ${bitLength}`);
        }
        return createTimestampUid(value);
      case 2:
        return createRandomUid(value);
      case 3:
        if (bitLength != 60) {
          throw new RangeError(`Invalid GeohashUID bit length: ${bitLength}`);
        }
        return createGeohashUid(value);
      default:
        throw new RangeError(`Invalid UID version: ${version}`);
    }
  }

  static fromBytes(bytes: Uint8Array): Uid {
    const length = bytes.length;
    if (length < 3) {
      throw new RangeError(`Invalid UID byte length: ${length}`);
    }
    const value = bytesToBigInt(bytes);
    return this.fromBigInt(value);
  }

  constructor() {
    throw new TypeError(`${this.constructor.name} is not a constructor`);
  }

  equals(other: any): boolean {
    return thisUidValue(this) === uidValues.get(other);
  }

  toBigInt(): bigint {
    return thisUidValue(this);
  }

  toString(encoding: UidEncoding = UidEncoding.base58) {
    const value = thisUidValue(this);
    return encoding === UidEncoding.base64
      ? Base64.encodeBigInt(value)
      : Base58.encodeBigInt(value);
  }

  toBytes(): Uint8Array {
    const value = thisUidValue(this);
    return bigIntToBytes(value);
  }
}

export class TimestampUid extends Uid {
  static #lastTimestamp?: number;
  static #lastTimestampUid?: TimestampUid;

  static now(): TimestampUid {
    const timestamp = Date.now();
    if (timestamp == this.#lastTimestamp) {
      return this.#lastTimestampUid;
    }
    this.#lastTimestamp = timestamp;
    const value = timestampUidInitialValue + BigInt(timestamp);
    const timestampUid = createTimestampUid(value);
    this.#lastTimestampUid = timestampUid;
    return timestampUid;
  }

  static parse(
    source: string,
    encoding: UidEncoding = UidEncoding.base58
  ): TimestampUid {
    const length = source.length;
    if (length < 9) {
      throw new RangeError(`Invalid TimestampUID length: ${length}`);
    }
    const value = encoding === UidEncoding.base64
      ? Base64.decodeBigInt(source)
      : Base58.decodeBigInt(source);
    return this.fromBigInt(value);
  }

  static tryParse(source: string, encoding: UidEncoding = UidEncoding.base58): TimestampUid | null {
    try {
      return this.parse(source, encoding);
    } catch (error) {
      return null;
    }
  }

  static fromBigInt(value: bigint): TimestampUid {
    const bitLength = bigIntBitLength(value);
    if (bitLength < 60 && bitLength != 52) {
      throw new RangeError(`Invalid TimestampUID bit length: ${bitLength}`);
    }
    const version = uidVersion(value, bitLength);
    if (version != 1) {
      throw new RangeError(`Invalid TimestampUID version: ${version}`);
    }
    return createTimestampUid(value);
  }

  static fromBytes(bytes: Uint8Array): TimestampUid {
    const length = bytes.length;
    if (length < 7) {
      throw new RangeError(`Invalid TimestampUID byte length: ${length}`);
    }
    const value = bytesToBigInt(bytes);
    return this.fromBigInt(value);
  }

  static fromDate(date: Date): TimestampUid {
    const timestamp = date.getTime();
    if (timestamp < 0) {
      throw new RangeError(`Invalid timestamp: ${timestamp}`);
    }
    const value = timestampUidInitialValue + BigInt(timestamp);
    return createTimestampUid(value);
  }

  constructor() {
    super();
  }

  toDate(): Date {
    const value = thisUidValue(this);
    const bitLength = bigIntBitLength(value);
    const timestampValue = value >> BigInt(bitLength - 52);
    const timestamp = Number(timestampValue - timestampUidInitialValue);
    return new Date(timestamp);
  }
}

export class RandomUid extends Uid {
  static parse(
    source: string,
    encoding: UidEncoding = UidEncoding.base58
  ): RandomUid {
    const length = source.length;
    if (length < 4) {
      throw new RangeError(`Invalid RandomUID length: ${length}`);
    }
    const value = encoding === UidEncoding.base64
      ? Base64.decodeBigInt(source)
      : Base58.decodeBigInt(source);
    return this.fromBigInt(value);
  }

  static tryParse(
    source: string,
    encoding: UidEncoding = UidEncoding.base58
  ): RandomUid | null {
    try {
      return this.parse(source, encoding);
    } catch (error) {
      return null;
    }
  }

  static fromBigInt(value: bigint): RandomUid {
    const bitLength = bigIntBitLength(value);
    if (bitLength < 24) {
      throw new RangeError(`Invalid RandomUID bit length: ${bitLength}`);
    }
    const version = uidVersion(value, bitLength);
    if (version != 2) {
      throw new RangeError(`Invalid RandomUID version: ${version}`);
    }
    return createRandomUid(value);
  }

  static fromBytes(bytes: Uint8Array): RandomUid {
    const length = bytes.length;
    if (length < 3) {
      throw new RangeError(`Invalid RandomUID byte length: ${length}`);
    }
    const value = bytesToBigInt(bytes);
    return this.fromBigInt(value);
  }

  constructor() {
    super();
  }
}

export class GeohashUid extends Uid {
  static parse(
    source: string,
    encoding: UidEncoding = UidEncoding.base58
  ): GeohashUid {
    const length = source.length;
    if (length < 10) {
      throw new RangeError(`Invalid GeohashUID length: ${length}`);
    }
    const value = encoding === UidEncoding.base64
      ? Base64.decodeBigInt(source)
      : Base58.decodeBigInt(source);
    return this.fromBigInt(value);
  }

  static tryParse(
    source: string,
    encoding: UidEncoding = UidEncoding.base58
  ): GeohashUid | null {
    try {
      return this.parse(source, encoding);
    } catch (error) {
      return null;
    }
  }

  static fromBigInt(value: bigint): GeohashUid {
    const bitLength = bigIntBitLength(value);
    if (bitLength != 60) {
      throw new RangeError(`Invalid GeohashUID bit length: ${bitLength}`);
    }
    const version = uidVersion(value, bitLength);
    if (version != 3) {
      throw new RangeError(`Invalid GeohashUID version: ${version}`);
    }
    return createGeohashUid(value);
  }

  static fromBytes(bytes: Uint8Array): GeohashUid {
    const length = bytes.length;
    if (length < 8) {
      throw new RangeError(`Invalid GeohashUID byte length: ${length}`);
    }
    const value = bytesToBigInt(bytes);
    return this.fromBigInt(value);
  }

  static fromCoordinates(latitude: number, longitude: number): GeohashUid {
    if (latitude < -90 || latitude > 90) {
      throw new RangeError(`latitude must be between -90 and 90: ${latitude}`);
    }
    if (longitude < -180 || longitude > 180) {
      throw new RangeError(`longitude must be between -180 and 180: ${longitude}`);
    }
    const value = geohashUidInitialValue + Geohash.encode(latitude, longitude);
    return createGeohashUid(value);
  }

  static fromLocation(location: Location): GeohashUid {
    return this.fromCoordinates(location.latitude, location.longitude);
  }

  constructor() {
    super();
  }

  toBoundingBox(): BoundingBox {
    const value = thisUidValue(this);
    return Geohash.decode(value - geohashUidInitialValue);
  }

  toLocation(): Location {
    const boundingBox = this.toBoundingBox();
    const deltaLatitude =
      (boundingBox.minLatitude + boundingBox.maxLatitude) / 2;
    const deltaLongitude =
      (boundingBox.minLongitude + boundingBox.maxLongitude) / 2;
    const normalizedLatitude = deltaLatitude.toFixed(6);
    const normalizedLongitude = deltaLongitude.toFixed(6);
    const latitude = Number.parseFloat(normalizedLatitude);
    const longitude = Number.parseFloat(normalizedLongitude);
    return new Location(latitude, longitude);
  }
}