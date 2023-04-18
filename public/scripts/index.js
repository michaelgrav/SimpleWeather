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


function askBrowserForLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getCords);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

function getCords(position) {
    var key = '061cec208840636a12589da186d087bd';
    
    fetch('https://api.openweathermap.org/data/3.0/onecall?lat=' + position.coords.latitude + '&lon=' + position.coords.longitude + '&appid=' + key)
    .then(function(resp) { return resp.json()  }) // Convert response to json
    .then(function(data) {
        insertFutureWeather(data.hourly)
    })
    .catch(function() {
        // Catch any errors
    })

    getCurrentWeather(position.coords.latitude, position.coords.longitude)      
}

// Current Weather
function getCurrentWeather(lat, lon) {
    var key = '061cec208840636a12589da186d087bd';
    
    fetch('https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&appid=' + key)
    .then(function(resp) { return resp.json()  }) // Convert response to json
    .then(function(data) {
        //console.log(data);
        insertCurrentWeather(data);
    })
    .catch(function() {
        // Catch any errors
    })
}

function insertCurrentWeather(d) {
    var fahrenheit = Math.round(((parseFloat(d.main.temp) - 273.15) * 1.8) + 32);
    const container = document.getElementById('currentWeatherContainer');

    var windSpeedMeterPerSec = d.wind.speed;
    var windSpeedMilePerHour = Math.round(windSpeedMeterPerSec * 2.237)

    if (d.weather[0].id == 800) {
        emojiID = 800;
    } else {
        var emojiID = firstDigit(d.weather[0].id);
    }

    const content = `
            <div class="mt-4 p-4 mainWeatherBackground text-white rounded">
                <h1>It's currently ${fahrenheit}&deg; in ${d.name} ${emojiMap.get(emojiID)}</h1>
                <br/>
                <p>Current Conditions? ${d.weather[0].main}</p>
                <p>More specifically, ${d.weather[0].description}</p>
                <p>Current wind speed is ${windSpeedMilePerHour}MPH</p>
            </div>
          `;
    
    container.innerHTML += content;
}


// Future Weather
function getFutureWeather(lat, lon) {
    var key = '061cec208840636a12589da186d087bd';
    
    fetch('https://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lon + '&appid=' + key)
    .then(function(resp) { return resp.json()  }) // Convert response to json
    .then(function(data) {
        //console.log(data);
        insertFutureWeather(data);
    })
    .catch(function() {
        // Catch any errors
    })
}

function insertFutureWeather(data) {
    const container = document.getElementById('futureWeatherContainer');

    data.forEach(forecast => {
        // Actual current temp
        //var fahrenheit = Math.round(((parseFloat(forecast.temp) - 273.15) * 1.8) + 32);
        var fahrenheitFeelLike = Math.round(((parseFloat(forecast.feels_like) - 273.15) * 1.8) + 32);

        date = new Date(forecast.dt * 1000)
        dateString = date.toDateString()
        time = formatAMPM(date)

        var rainChance = (forecast.pop * 100).toFixed(0);

        if (forecast.weather[0].id == 800) {
            emojiID = 800;
        } else {
            var emojiID = firstDigit(forecast.weather[0].id);
        }

        const content = `
        <div class="card">
        <h5 class="card-header text-light">${dateString} at ${time} ${emojiMap.get(emojiID)}</h5>
        <div class="card-body text-light">
          <h3 class="card-title text-light">It will be ${fahrenheitFeelLike}&deg;</h3>
          <p class="card-text text-light">Conditions: ${forecast.weather[0].main} (${forecast.weather[0].description})</p>
          <h5 class="card-text text-light">Chance of rain is ${rainChance}%</h5>
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

window.onload = function() {
    askBrowserForLocation();
}