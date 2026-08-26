import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const rootDir = resolve(new URL('..', import.meta.url).pathname);
const { mockService } = require(resolve(rootDir, 'miniprogram/services/mock-service.js'));

const errors = [];
const assert = (condition, message) => {
  if (!condition) errors.push(message);
};

const home = await mockService.getHome();
assert(home.frequentStores.length > 0, 'home should expose at least one frequent store');
assert(home.nearbyStores.length > 0, 'home should expose nearby stores');
assert(home.frequentStores.every((store) => store.isFrequent), 'frequentStores should only contain frequent stores');
assert(home.nearbyStores.every((store) => !store.isFrequent), 'nearbyStores should only contain non-frequent stores');
assert(!home.frequentStores.some((frequent) => home.nearbyStores.some((nearby) => nearby.id === frequent.id)), 'frequent and nearby stores should not overlap');

const wxml = readFileSync(resolve(rootDir, 'miniprogram/pages/home/index.wxml'), 'utf8');
const frequentIndex = wxml.indexOf('{{copy.frequentTitle}}');
const nearbyIndex = wxml.indexOf('{{copy.nearbyTitle}}');
const servicesIndex = wxml.indexOf('{{copy.featuredServiceTitle}}');
assert(frequentIndex >= 0, 'home WXML should render frequent store section');
assert(nearbyIndex >= 0, 'home WXML should render nearby store section');
assert(servicesIndex >= 0, 'home WXML should render featured service section');
assert(frequentIndex < nearbyIndex, 'home WXML should render frequent stores before nearby stores');
assert(nearbyIndex < servicesIndex, 'home WXML should render stores before featured services');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log('Home order smoke passed.');
