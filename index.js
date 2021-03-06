//  fips codes for state, required for US Census API
var fipsCode = {
	01: "alabama",
	02: "alaska",
	04: "arizona",
	05: "arkansas",
	06: "california",
	08: "colorado",
	09: "connecticut",
	10: "delaware",
	11: "district of columbia",
	12: "florida",
	13: "georgia",
	// 15: "hawaii",
	16: "idaho",
	17: "illinois",
	18: "indiana",
	19: "iowa",
	20: "kansas",
	21: "kentucky",
	22: "louisiana",
	23: "maine",
	24: "maryland",
	25: "massachusetts",
	26: "michigan",
	27: "minnesota",
	28: "mississippi",
	29: "missouri",
	30: "montana",
	31: "nebraska",
	32: "nevada",
	33: "new hampshire",
	34: "new jersey",
	35: "new mexico",
	36: "new york",
	37: "north carolina",
	38: "north dakota",
	39: "ohio",
	40: "oklahoma",
	41: "oregon",
	42: "pennsylvania",
	// 44: "rhode island",
	45: "south carolina",
	46: "south dakota",
	47: "tennessee",
	48: "texas",
	49: "utah",
	50: "vermont",
	51: "virginia",
	53: "washington",
	54: "west virginia",
	55: "wisconsin",
	56: "wyoming"
}

var searchState = '';
var stateFip = '';
var stateLatLong = {};
var lat; 
var searchEntry;

function listenSubmit() {
	$('.search-form').submit(event => {
		event.preventDefault();
		const searchEntry = $(event.currentTarget).find('.query-box');
		searchState = $.trim(searchEntry.val().toLowerCase());
		stateFip = Object.keys(fipsCode).find(key => fipsCode[key] === searchState);
		if (Number(stateFip) >=1 && Number(stateFip) <= 56){
		$('.banner').hide();
		$('.results-page').show();
		getStateData();
		header();
		newState();
		}
		else {
		$('.error').html(`<span class='error'>State is not valid. Make sure it is spelled correctly.</span>`);
		}
	});
}

// creates header for results page
function header(){
	$('.h2').replaceWith(`<h2 class='h2'>${searchState.substr(0,1).toUpperCase()+searchState.substr(1)}</h2>`);
}

// capitalize each word in state 
function convert_case(text) {
return text.toLowerCase()
    .split(' ')
    .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
    .join(' ');
}

// call to US Census API, retrieves US population
function populations(){
	fetch(`https://api.census.gov/data/2017/pep/population?get=POP,GEONAME&for=us:*&key=a57b95a92b2d8258e380064424fa93c36bbd8465`)
	.then(response => response.json())
	.then(function(data){
		var usPop = Number(data[1][0]).toLocaleString('en');
		$('.usData').html(`<div class="usData">The population of the United States is ${usPop}<br></div>`);
	});

// call to US Census API, retrieves selected state population
	fetch(`https://api.census.gov/data/2017/pep/population?get=POP,GEONAME&for=state:${stateFip}&key=a57b95a92b2d8258e380064424fa93c36bbd8465`)
	.then(response => response.json())
	.then(function(data){
		var statePop = Number(data[1][0]).toLocaleString();
		$('.stateData').html(`<div class="stateData">The population of ${searchState.substr(0,1).toUpperCase()+searchState.substr(1)} is ${statePop}</div>`);
	});

// call to US Census API, pulls list of cities for selected state and pulls data for each city. Data is filtered, edited and ordered (using 'citySort function') to return the 10 biggest cities in order 
	fetch(`https://api.census.gov/data/2017/pep/population?get=POP,GEONAME&for=place:*&in=state:${stateFip}&key=a57b95a92b2d8258e380064424fa93c36bbd8465`)
	.then(response => response.json())
	.then(function (data) {
		data.shift();
      //change population element from string to number so it can be sorted 
      for (i = 0; i < data.length; i++) {
      	data[i][0] = parseInt(data[i][0], 10);
      }
      //sort two dimensional array by first element 
      data = data.sort(function (a, b) {
      	return b[0] - a[0];
      });
      //insert html 
      $('.cityPopData').html(`<h3>${searchState.substr(0,1).toUpperCase()+searchState.substr(1)}'s 10 most populated cities:</h3>${citySort(data)}`);
  });
}

//take all cities, find the biggest 10 and make html string. also performs some formatting as the output from the census API is not pretty.
function citySort(array) {
	let htmlInsert = '';
	for (i = 0; i < 10; i++) {
		htmlInsert += `${array[i][1]}: ${array[i][0].toLocaleString()}<br>`;
	};

	var state = convert_case(searchState);

	htmlInsert = htmlInsert.replace(/city,/g, '').replace(/consolidated/g, '').replace(/government/g, '').replace(/, /g, '').replace(/unified/g,'').replace(/\(balance\)/g,'');
	if (state != "New York"){
	htmlInsert = htmlInsert.split(state).join();
	htmlInsert = htmlInsert.replace(/  ,/g, '').replace(/,/g, '');
}
	return htmlInsert;
}

// takes the user selected state, calls to US Census API to get the latitude longitude  coordinates for the selected state, then uses the lat/long coordinates to create a map centered and marked on the selected state 
function getLatLong (){
	fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${searchState}&key=AIzaSyCONTlisYZNQU21IAYvjvzI2UuPgR_NSQY`)
	.then(response => response.json())
	.then(function(data){
		stateLatLong = (data.results[0].geometry.location);
		var lat = stateLatLong.lat;
		var lng = stateLatLong.lng;

	$('.map').replaceWith(
		`<div class="map" id="map">
		<script>
		var map;
		function initMap() {
			map = new google.maps.Map(document.getElementById('map'), {
				center: {lat: ${lat}, lng: ${lng}},
				zoom: 6
			});
			var marker = new google.maps.Marker({position: {lat: ${lat}, lng: ${lng}}, map: map});
		}
		</script>
		</div>

		<script async defer src="https://maps.googleapis.com/maps/api/js?key=AIzaSyCONTlisYZNQU21IAYvjvzI2UuPgR_NSQY&callback=initMap">
		</script>`
		);
        });
}

// create search box for user to have a place to enter additional states
function newState() {
	$('.newState').html(`
		<form action="#" class="search-form" id="search" role="form">
			<fieldset>
			<legend class="newState"></legend>
			<label for="query" text="Enter State"></label>
			<input type="text" class="query-box" id="query" name="searchfield" placeholder=" Try Another State" required spellcheck="true">
			<button type="submit" name="submit-button" role="button">Get Data</button>
		</fieldset>
		</form>
		<div class='error'></div>`);
	listenSubmit();
}

function getStateData() {
	getLatLong();
	populations();
	newState();
}


listenSubmit();