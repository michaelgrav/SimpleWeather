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
    if(sessionStorage.getItem("searchLat") != null && sessionStorage.getItem("searchLon") != null) {
       var searchLat = sessionStorage.getItem("searchLat");
       var searchLon = sessionStorage.getItem("searchLon");

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
    var excludedAPIFields = "minutely";

    try {
        fetch('https://api.openweathermap.org/data/3.0/onecall?lat=' + lat + '&lon=' + lon + '&exclude=' + excludedAPIFields + '&appid=' + key)
        .then(function(resp) { return resp.json()  }) // Convert response to json
        .then(function(data) {
            // console.log(data);
            if('alerts' in data) insertWeatherAlerts(data.alerts);
            insertCurrentWeather(data.current)
            insertFutureWeather(data.hourly, data.daily);
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
            <p>🍃 Current wind speed is ${windSpeedMilePerHour}mph with gusts up to ${windGustMilePerHour}mph</p>
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

/*
    These containers will hold each day's weather forecast
*/
function createFutureWeatherContainers(data) {
    const mainContainer = document.getElementById('futureWeatherContainer');

    //// console.log(data);
    data.forEach(forecast => {
        var date = new Date(forecast.dt * 1000);
        var dateString = date.toDateString();
        var tableBodyID = dateString + "-table-body";
        var dayCardID = dateString + "-day-summary-card";
        const content = `
            <div id="${dateString}">
                <div id="${dayCardID}"></div>
                <div class="table-responsive" id="${dateString+"-entire-table"}">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th scope="col">Time</th>
                                <th scope="col">Conditions</th>
                                <th scope="col">Temp</th>
                                <th scope="col">Feels Like</th>
                                <th scope="col">Rain Chance</th>
                                <th scope="col">Cloud Coverage</th>
                            </tr>
                        </thead>
                        <tbody id="${tableBodyID}"></tbody>
                    </table>
                </div>
            </div>
          `;
    
        mainContainer.innerHTML += content;
    });
}

function insertFutureWeather(data, dataDaily) {
    createFutureWeatherContainers(dataDaily);

    var dayEnteries = new Set();

    data.shift();

    data.forEach(forecast => {

        // Actual current temp
        var fahrenheit = Math.round(((parseFloat(forecast.temp) - 273.15) * 1.8) + 32);
        var fahrenheitFeelLike = Math.round(((parseFloat(forecast.feels_like) - 273.15) * 1.8) + 32);

        var date = new Date(forecast.dt * 1000);
        var dateString = date.toDateString();
        var time = formatAMPM(date);

        var currDate = new Date();
        var currDateString = currDate.toDateString();
        let dateText = "";

        const tomorrow = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));

        const container = document.getElementById(dateString + "-day-summary-card");

        // Date is today
        if(currDateString == dateString) {
            dayEnteries.add(dateString);
            dateText = "Today"
        }

        // Date is tomorrow
        else if (tomorrow.toDateString() == dateString) {
            dayEnteries.add(dateString);
            dateText = "Tomorrow"

            if(!dayEnteries.has(dateText)) {
                dayEnteries.add(dateText);


                var daySummary = ``
                // Add the summary card for that day
                dataDaily.forEach(dayEntry => {
                    var dayDate = new Date(dayEntry.dt * 1000).toDateString();
                    if(dayDate == dateString) {
                        daySummary = futureWeatherCard(dayEntry, dayDate)
                    }
                });
                container.innerHTML += daySummary;
            }
        }

        // Date is sometime past tomorrow
        else {
            dateText = dateString
            if(!dayEnteries.has(dateText)) {
                dayEnteries.add(dateText)

                var daySummary = ``
                // Add the summary card for that day
                dataDaily.forEach(dayEntry => {
                    var dayDate = new Date(dayEntry.dt * 1000).toDateString();
                    if(dayDate == dateString) {
                        daySummary = futureWeatherCard(dayEntry, dayDate)
                    }
                });
                container.innerHTML += daySummary;
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

        const hourlyContainer = document.getElementById(dateString+"-table-body");

        const content = `
            <tr>
                <td>${time}</td>
                <td>${detailedForecastText}</td>
                <td>${fahrenheit}&deg;</td>
                <td>${fahrenheitFeelLike}&deg;</td>
                <td>${rainChance}%</td>
                <td>${forecast.clouds}%</td>
            </tr>
          `;
    
        hourlyContainer.innerHTML += content;
    });

    // Insert the rest of the future days
    dataDaily.forEach(dayEntry => {
        var dayDate = new Date(dayEntry.dt * 1000).toDateString();
        if(!dayEnteries.has(dayDate)) {
            const container = document.getElementById(dayDate + "-day-summary-card");
            var daySummary = futureWeatherCard(dayEntry, dayDate)
            container.innerHTML += daySummary;

            // Clean up the days that shouldn'y have tables (no hourly results)
            const element = document.getElementById(dayDate+"-entire-table");
            element.remove();
        }
    });
}

function futureWeatherCard(data, date) {
    var max_fahrenheit = Math.round(((parseFloat(data.temp.max) - 273.15) * 1.8) + 32);
    var min_fahrenheit = Math.round(((parseFloat(data.temp.min) - 273.15) * 1.8) + 32);

    var windSpeedMeterPerSec = data.wind_speed;
    var windGustMeterPerSec = data.wind_gust;

    var windSpeedMilePerHour = Math.round(windSpeedMeterPerSec * 2.237)
    var windGustMilePerHour = Math.round(windGustMeterPerSec * 2.237)

    var cloudCoverage = data.clouds;

    var sunRiseTime = formatAMPM(new Date(data.sunrise * 1000));
    var sunSetTime = formatAMPM(new Date(data.sunset * 1000));

    if (data.weather[0].id == 800) {
        emojiID = 800;
    } else {
        var emojiID = firstDigit(data.weather[0].id);
    }

    return `
    <hr/>
    <div class="mt-4 p-3 mainWeatherBackground text-black rounded border">
        <h1>${date}: ${data.summary}</h1>
        <br/>
        <p>🌡️ High will be ${max_fahrenheit}&deg;, low will be ${min_fahrenheit}&deg;</p>
        <p>☂️ Chance of rain for the day is ${(data.pop * 100).toFixed(0)}%</p>
        <p>🍃 Wind conditions will be ${windSpeedMilePerHour}mph with gusts up to ${windGustMilePerHour}mph</p>
        <p>☁️ Cloud coverage will be ${cloudCoverage}%</p>
        <p>🌅 The sun will rise at at ${sunRiseTime} and set at ${sunSetTime}</p>
    </div>
    `;
}

function insertWeatherAlerts(data) {
    const warningContainer = document.getElementById('weatherAlertsContainer');

    //f8d7da
    const alertDropdown = `
    <p class="d-inline-flex gap-1">
        <button class="btn btn-danger" type="button" data-bs-toggle="collapse" data-bs-target="#collaspedAlertContainer" aria-expanded="false" aria-controls="collaspedAlertContainer">
            View ${data.length} weather alerts
        </button>
    </p>

    <div class="collapse" id="collaspedAlertContainer"></div>
    `

    warningContainer.innerHTML += alertDropdown;

    // console.log(data);

    // Insert each alert
    data.forEach(alert => {
        const collaspedAlertContainer = document.getElementById('collaspedAlertContainer')
        var startDate = new Date(alert.start * 1000);
        var startDateString = startDate.toDateString();
        var startTime = formatAMPM(startDate);

        var endDate = new Date(alert.end * 1000);
        var endDateString = endDate.toDateString();
        var endTime = formatAMPM(endDate);

        const content = `
        <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">${alert.event}</h4>
            <p class="mb-0">${startDateString} at ${startTime} to ${endDateString} at ${endTime}</p>

            <p class="pt-3 pb-1">${alert.description}</p>

            <p class="mb-0">Issuer: ${alert.sender_name}</p>
        </div>
        
          `;

        collaspedAlertContainer.innerHTML += content;
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
            //console.log(data)
            city = data[0].name;
            state = data[0].state;

            if (state.length > 2) {
                state = stateNameToAbbreviation(state)
            }

            var content = "Forecast for " + city + ", " + state;

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