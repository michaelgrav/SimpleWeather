var dataFromAPICall;
let emojiMap = new Map([
    ["overcast clouds", String.fromCodePoint(0x2601)],
    ["light rain", String.fromCodePoint(0x1F327)],
    ["moderate rain", String.fromCodePoint(0x1F327)],
    ["broken clouds", String.fromCodePoint(0x26C5)],
    ["scattered clouds", String.fromCodePoint(0x26C5)],
    ["few clouds", String.fromCodePoint(0x26C5)],
    ["clear sky", String.fromCodePoint(0x2600)]
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

    const content = `
            <div class="mt-2 p-4 mainWeatherBackground text-white rounded">
                <h1>It's currently ${fahrenheit}&deg; in ${d.name} ${emojiMap.get(d.weather[0].description)}</h1>
                <br/>
                <p>Current Conditions? ${d.weather[0].main}</p>
                <p>More specifically, ${d.weather[0].description}</p>
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
        //console.log("in forecast")
        // Actual current temp
        //var fahrenheit = Math.round(((parseFloat(forecast.temp) - 273.15) * 1.8) + 32);
        var fahrenheitFeelLike = Math.round(((parseFloat(forecast.feels_like) - 273.15) * 1.8) + 32);

        date = new Date(forecast.dt * 1000)
        dateString = date.toDateString()
        time = formatAMPM(date)

        var rainChance = (forecast.pop * 100).toFixed(0);

        const content = `
        <div class="card">
        <h5 class="card-header text-light">${dateString} at ${time} ${emojiMap.get(forecast.weather[0].description)}</h5>
        <div class="card-body text-light">
          <h5 class="card-title text-light">${forecast.weather[0].main} (${forecast.weather[0].description})</h5>
          <p class="card-text text-light">It will be ${fahrenheitFeelLike}&deg;</p>
          <p class="card-text text-light">Chance of rain is ${rainChance}%</p>
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

window.onload = function() {
    askBrowserForLocation();
}