var dataFromAPICall;
let emojiMap = new Map([
    [8, String.fromCodePoint(0x2601)],
    [5, String.fromCodePoint(0x1F327)],
    [3, String.fromCodePoint(0x1F327)],
    [800, String.fromCodePoint(0x2600)],
    [7, String.fromCodePoint(0x1F32B)],
    [6, String.fromCodePoint(0x1F328)],
    [2, String.fromCodePoint(0x26C8)]
]);
var key = '061cec208840636a12589da186d087bd';
var city = ''
var state = ''


function askBrowserForLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getCords);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

/*
    Main function that calls the other functions
    update navbar > get current weather > get future weather
*/
function getCords(position) {
    updateNavbarText(position.coords.latitude, position.coords.longitude)   
    
    // Load the future forecast last
    fetch('https://api.openweathermap.org/data/3.0/onecall?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&appid=' + key)
    .then(function(resp) { return resp.json()  }) // Convert response to json
    .then(function(data) {
        console.log(data);
        insertCurrentWeather(data.current)
        insertFutureWeather(data.hourly);
    })
    .catch(function() {
        // Catch any errors
        console.error("Error calling the weather API");
    })  
}

function insertCurrentWeather(d) {
    const container = document.getElementById('currentWeatherContainer');

    var current_fahrenheit = Math.round(((parseFloat(d.temp) - 273.15) * 1.8) + 32);
    var feels_like_fahrenheit = Math.round(((parseFloat(d.feels_like) - 273.15) * 1.8) + 32);

    var windSpeedMeterPerSec = d.wind_speed;
    var windGustMeterPerSec = d.wind_gust;

    var windSpeedMilePerHour = Math.round(windSpeedMeterPerSec * 2.237)
    var windGustMilePerHour = Math.round(windGustMeterPerSec * 2.237)

    var cloudCoverage = d.clouds;

    var mainWeatherConditions = d.weather[0].main;
    var detailedWeatherConditions = d.weather[0].description
    if (mainWeatherConditions == "Clear") mainWeatherConditions = "☂️ Current Conditions: " + "Clear skies ahead!";
    else mainWeatherConditions = "☂️ Current Conditions: " + mainWeatherConditions + " (more specifically, " + detailedWeatherConditions + ")"

    var sunSetTime = formatAMPM(new Date(d.sunset * 1000));

    if (d.weather[0].id == 800) {
        emojiID = 800;
    } else {
        var emojiID = firstDigit(d.weather[0].id);
    }

    const content = `
            <div class="mt-4 p-3 mainWeatherBackground text-black rounded border">
                <h1>It's currently ${current_fahrenheit}&deg; in ${city} ${emojiMap.get(emojiID)}</h1>
                <br/>
                <p>${mainWeatherConditions}</p>
                <p>🌡️ It currently feels like ${feels_like_fahrenheit}&deg;</p>
                <p>🍃 Current wind speed is ${windSpeedMilePerHour}MPH with gusts up to ${windGustMilePerHour}MPH</p>
                <p>☁️ Cloud coverage is ${cloudCoverage}%</p>
                <p>🌅 The sun set(s) at ${sunSetTime}</p>
            </div>
          `;
    
    container.innerHTML += content;
}

function insertFutureWeather(data) {
    const container = document.getElementById('futureWeatherContainer');

    var dayEnteries = new Set();

    data.forEach(forecast => {
        // Actual current temp
        var fahrenheit = Math.round(((parseFloat(forecast.temp) - 273.15) * 1.8) + 32);
        //var fahrenheitFeelLike = Math.round(((parseFloat(forecast.feels_like) - 273.15) * 1.8) + 32);

        date = new Date(forecast.dt * 1000)
        dateString = date.toDateString()
        time = formatAMPM(date)

        currDate = new Date()
        currDateString = currDate.toDateString()
        let dateText = ""

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

        detailedForecastText = "";
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

function updateNavbarText(lat, lon) {
    const container = document.getElementById('navbarForLocationDisplay');

    fetch('https://api.openweathermap.org/geo/1.0/reverse?lat=' + lat + '&lon=' + lon + '&appid=' + key)
    .then(function(resp) { return resp.json()  }) // Convert response to json
    .then(function(data) {
        content = "Weather forecast for " + data[0].name + ", " + data[0].state;
        city = data[0].name;
        state = data[0].state;
        container.innerHTML += content;
    })
    .catch(function() {
        console.error("error getting the user's location for the navbar text")
    })
}

window.onload = function() {
    askBrowserForLocation();
}