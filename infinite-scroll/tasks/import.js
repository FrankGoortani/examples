'use strict';

var algoliasearch = require('algoliasearch')
  , _ = require('lodash')
  , async = require('async');

var data = require('../data.json');
var chunkedDate = _.chunk(data, 10000);

var args = process.argv.slice(2)
  , applicationId = args[0]
  , apiKey = args[1]
  , indexBase = args[2];

var client = algoliasearch(applicationId, apiKey)
  , index = client.initIndex(indexBase);

var settings = {
  attributesToIndex: ['brand', 'name', 'categories', 'hierarchicalCategories', 'unordered(description)'],
  customRanking: ['desc(popularity)'],
  attributesForFaceting: ['brand', 'price_range', 'categories', 'hierarchicalCategories', 'type', 'price'],
  minWordSizefor1Typo: 3,
  minWordSizefor2Typos: 7
};

var indexSettings = _.clone(settings, true);
var priceDescSettings = _.clone(settings, true);
var priceAscSettings = _.clone(settings, true);

indexSettings.ignorePlurals = true;
indexSettings.slaves = [`#{indexBase}_price_desc`, `#{indexBase}_price_asc`];

priceDescSettings.ranking = ['desc(price)', 'typo', 'geo', 'words', 'proximity', 'attribute', 'exact', 'custom'];
priceAscSettings.ranking = ['asc(price)', 'typo', 'geo', 'words', 'proximity', 'attribute', 'exact', 'custom'];

index.setSettings(indexSettings);

// We need to initialize the slave indices that we specify above so that we can change their settings
client.initIndex(`#{indexBase}_price_desc`).setSettings(priceDescSettings);
client.initIndex(`#{indexBase}_price_asc`).setSettings(priceAscSettings);

// Clear the index so we start from scratch
index.clear();

// Index our data
async.each(chunkedData, index.saveObjects.bind(index), finish);
