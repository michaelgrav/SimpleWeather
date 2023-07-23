//import {searchLat, searchLon} from "./searchlocation.js"

let emojiMap = new Map([
    [8, String.fromCodePoint(0x2601)],
    [5, String.fromCodePoint(0x1F327)],
    [3, String.fromCodePoint(0x1F327)],
    [800, String.fromCodePoint(0x2600)],
    [7, String.fromCodePoint(0x1F32B)],
    [6, String.fromCodePoint(0x1F328)],
    [2, String.fromCodePoint(0x26C8)]
]);

// Variables
const key = '061cec208840636a12589da186d087bd';
var city = ''
var state = ''


function askBrowserForLocation() {
    // We searched for a location
    console.log("searchLat: " + sessionStorage.getItem("searchLat"));
    console.log("searchLon: " + sessionStorage.getItem("searchLon"));

    if(sessionStorage.getItem("searchLat") != null && sessionStorage.getItem("searchLon") != null) {
       var searchLat = sessionStorage.getItem("searchLat");
       var searchLon = sessionStorage.getItem("searchLon");
       console.log("search lat and lon wern't empty");
       updateNavbarText(searchLat, searchLon);
       getWeather(searchLat, searchLon)
       sessionStorage.clear();
    }

    // We didn't search for a location (use current location)
    else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(updatePage);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}


/*
    Main function that calls the other functions
    update navbar > get current weather > get future weather
*/
function updatePage(position) {
    updateNavbarText(position.coords.latitude, position.coords.longitude)   
    getWeather(position.coords.latitude, position.coords.longitude)
}

function getWeather(lat, lon) {
    var excludedAPIFields = "minutely,daily";

    try {
        fetch('https://api.openweathermap.org/data/3.0/onecall?lat=' + lat + '&lon=' + lon + '&exclude=' + excludedAPIFields + '&appid=' + key)
        .then(function(resp) { return resp.json()  }) // Convert response to json
        .then(function(data) {
            console.log(data);
            insertCurrentWeather(data.current)
            insertFutureWeather(data.hourly);
        })
    } catch(error) {
        console.error(error)
    }
}

function insertCurrentWeather(data) {
    const container = document.getElementById('currentWeatherContainer');

    var current_fahrenheit = Math.round(((parseFloat(data.temp) - 273.15) * 1.8) + 32);
    var feels_like_fahrenheit = Math.round(((parseFloat(data.feels_like) - 273.15) * 1.8) + 32);

    var windSpeedMeterPerSec = data.wind_speed;
    var windGustMeterPerSec = data.wind_gust;

    var windSpeedMilePerHour = Math.round(windSpeedMeterPerSec * 2.237)
    var windGustMilePerHour = Math.round(windGustMeterPerSec * 2.237)

    var cloudCoverage = data.clouds;

    var mainWeatherConditions = data.weather[0].main;
    var detailedWeatherConditions = data.weather[0].description
    if (mainWeatherConditions == "Clear") mainWeatherConditions = "☂️ Current Conditions: " + "Clear skies ahead!";
    else mainWeatherConditions = "☂️ Current Conditions: " + mainWeatherConditions + " (more specifically, " + detailedWeatherConditions + ")"

    var sunSetTime = formatAMPM(new Date(data.sunset * 1000));

    if (data.weather[0].id == 800) {
        emojiID = 800;
    } else {
        var emojiID = firstDigit(data.weather[0].id);
    }

    if(!Number.isNaN(windGustMilePerHour)) {
        var content = `
        <div class="mt-4 p-3 mainWeatherBackground text-black rounded border">
            <h1>It's currently ${current_fahrenheit}&deg; in ${city} ${emojiMap.get(emojiID)}</h1>
            <br/>
            <p>${mainWeatherConditions}</p>
            <p>🌡️ It currently feels like ${feels_like_fahrenheit}&deg;</p>
            <p>🍃 Current wind speed is ${windSpeedMilePerHour}mph with gusts up to ${windGustMilePerHour}MPH</p>
            <p>☁️ Cloud coverage is ${cloudCoverage}%</p>
            <p>🌅 The sun set(s) at ${sunSetTime}</p>
        </div>
      `;
    } 
    else {
        var content = `
            <div class="mt-4 p-3 mainWeatherBackground text-black rounded border">
                <h1>It's currently ${current_fahrenheit}&deg; in ${city} ${emojiMap.get(emojiID)}</h1>
                <br/>
                <p>${mainWeatherConditions}</p>
                <p>🌡️ It currently feels like ${feels_like_fahrenheit}&deg;</p>
                <p>🍃 Current wind speed is ${windSpeedMilePerHour}mph</p>
                <p>☁️ Cloud coverage is ${cloudCoverage}%</p>
                <p>🌅 The sun set(s) at ${sunSetTime}</p>
            </div>
        `;
    }
    
    
    container.innerHTML += content;
}

function insertFutureWeather(data) {
    const container = document.getElementById('futureWeatherContainer');

    var dayEnteries = new Set();

    data.forEach(forecast => {
        // Actual current temp
        var fahrenheit = Math.round(((parseFloat(forecast.temp) - 273.15) * 1.8) + 32);
        //var fahrenheitFeelLike = Math.round(((parseFloat(forecast.feels_like) - 273.15) * 1.8) + 32);

        var date = new Date(forecast.dt * 1000);
        var dateString = date.toDateString();
        var time = formatAMPM(date);

        var currDate = new Date();
        var currDateString = currDate.toDateString();
        let dateText = "";

        const tomorrow = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));

        // Date is today
        if(currDateString == dateString) dateText = "Today"

        // Date is tomorrow
        else if (tomorrow.toDateString() == dateString) {
            dateText = "Tomorrow"

            if(!dayEnteries.has(dateText)) {
                var tomorrowHeadingText = `
                <hr/>
                <h1 class="text-dark p-1 mb-3"><center>${dateText} (${dateString})</center></h1>
                `;

                container.innerHTML += tomorrowHeadingText;
                dayEnteries.add(dateText)
            }
        }

        // Date is sometime past tomorrow
        else {
            dateText = dateString
            if(!dayEnteries.has(dateText)) {
                var tomorrowHeadingText = `
                <hr/>
                <h1 class="text-dark p-1 mb-4"><center>${dateText}</center></h1>
                `;

                container.innerHTML += tomorrowHeadingText;
                dayEnteries.add(dateText)
            }
        }

        var detailedForecastText = "";
        if (forecast.weather[0].description == "clear sky") detailedForecastText = "a clear sky"
        else detailedForecastText = forecast.weather[0].description

        var rainChance = (forecast.pop * 100).toFixed(0);

        if (forecast.weather[0].id == 800) {
            emojiID = 800;
        } else {
            var emojiID = firstDigit(forecast.weather[0].id);
        }

        const content = `
            <div class="card">
            <h5 class="card-header text-dark">${dateText} at ${time} ${emojiMap.get(emojiID)}</h5>
            <div class="card-body text-dark">
            <h3 class="card-title text-dark">It will be ${fahrenheit}&deg; with ${detailedForecastText}</h3>         
            <p class="card-text text-dark" style="margin-bottom:0;">Chance of rain is ${rainChance}%</p>
            <p class="card-text text-dark" style="margin:0; padding-top:0;">Cloud coverage will be ${forecast.clouds}%</p>
            </div>
            </div>
            <br/>
          `;
    
        container.innerHTML += content;
    });
}


/*
    HELPER METHODS
*/
function formatAMPM(date) {
    var hours = date.getHours();
    var minutes = date.getMinutes();
    var ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0'+minutes : minutes;
    var strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
}

function firstDigit(num) {
    // 1: get first digit using regex pattern
    const matches = String(num).match(/\d/);
    // 2: convert matched item to integer
    const digit = Number(matches[0]);
    // 3: add sign back as needed
    return (num < 0) ? -digit : digit;
}


/*
    NAVBAR METHODS
*/
export function updateNavbarText(lat, lon) {
    const container = document.getElementById('navbarForLocationDisplay');

    try {
        fetch('https://api.openweathermap.org/geo/1.0/reverse?lat=' + lat + '&lon=' + lon + '&appid=' + key)
        .then(function(resp) { return resp.json()  }) // Convert response to json
        .then(function(data) {
            var content = "Forecast for " + data[0].name + ", " + stateNameToAbbreviation(data[0].state);
            city = data[0].name;
            state = data[0].state;
            container.innerHTML += content;
        })  
    } catch(error) {
        console.error(error)
    }
}

function stateNameToAbbreviation(name) {
	let states = {
		"arizona": "AZ",
		"alabama": "AL",
		"alaska": "AK",
		"arkansas": "AR",
		"california": "CA",
		"colorado": "CO",
		"connecticut": "CT",
		"district of columbia": "DC",
		"delaware": "DE",
		"florida": "FL",
		"georgia": "GA",
		"hawaii": "HI",
		"idaho": "ID",
		"illinois": "IL",
		"indiana": "IN",
		"iowa": "IA",
		"kansas": "KS",
		"kentucky": "KY",
		"louisiana": "LA",
		"maine": "ME",
		"maryland": "MD",
		"massachusetts": "MA",
		"michigan": "MI",
		"minnesota": "MN",
		"mississippi": "MS",
		"missouri": "MO",
		"montana": "MT",
		"nebraska": "NE",
		"nevada": "NV",
		"new hampshire": "NH",
		"new jersey": "NJ",
		"new mexico": "NM",
		"new york": "NY",
		"north carolina": "NC",
		"north dakota": "ND",
		"ohio": "OH",
		"oklahoma": "OK",
		"oregon": "OR",
		"pennsylvania": "PA",
		"rhode island": "RI",
		"south carolina": "SC",
		"south dakota": "SD",
		"tennessee": "TN",
		"texas": "TX",
		"utah": "UT",
		"vermont": "VT",
		"virginia": "VA",
		"washington": "WA",
		"west virginia": "WV",
		"wisconsin": "WI",
		"wyoming": "WY",
		"american samoa": "AS",
		"guam": "GU",
		"northern mariana islands": "MP",
		"puerto rico": "PR",
		"us virgin islands": "VI",
		"us minor outlying islands": "UM"
	}

	let a = name.trim().replace(/[^\w ]/g, "").toLowerCase(); //Trim, remove all non-word characters with the exception of spaces, and convert to lowercase
	if(states[a] !== null) {
		return states[a];
	}

	return null;
}

window.onload = function() {
    askBrowserForLocation();
}