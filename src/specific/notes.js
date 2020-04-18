"use strict";

if(typeof $ !== 'undefined'){
  const $ = require('jquery');
} // dynamic jquery support


$('.grid').masonry({
  itemSelector: '.grid-item',
  columnWidth: '.grid-sizer',
  percentPosition: true
});
