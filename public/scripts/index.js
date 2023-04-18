
function askBrowserForLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(getCords);
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

function getCords(position) {
    getCurrentWeather(position.coords.latitude, position.coords.longitude)  
    getFutureWeather(position.coords.latitude, position.coords.longitude)      
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
            <div id="description">Current Conditions? ${d.weather[0].description}</div>
            <div id="temp">It is currently ${fahrenheit}&deg; in ${d.name}</div>
          `;
    
    container.innerHTML += content;
}


// Future Weather
function getFutureWeather(lat, lon) {
    var key = '061cec208840636a12589da186d087bd';
    
    fetch('https://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lon + '&appid=' + key)
    .then(function(resp) { return resp.json()  }) // Convert response to json
    .then(function(data) {
        console.log(data);
        insertFutureWeather(data);
    })
    .catch(function() {
        // Catch any errors
    })
}

function insertFutureWeather(data) {
    const container = document.getElementById('futureWeatherContainer');

    data.list.forEach(forecast => {
        //console.log(forecast)
        var fahrenheit = Math.round(((parseFloat(forecast.main.temp) - 273.15) * 1.8) + 32);

        time = moment(forecast.dt_txt.split(" ")[1], 'HH:mm:ss').format('h:mm:ss A')
        date = new Date(forecast.dt_txt).toDateString()

        const content = `
        <div class="card">
        <h5 class="card-header">${date} at ${time}</h5>
        <div class="card-body">
          <h5 class="card-title">${forecast.weather[0].description}</h5>
          <p class="card-text">It will be ${fahrenheit}&deg;</p>
        </div>
        </div>
          `;
    
        container.innerHTML += content;
    });
}

window.onload = function() {
    askBrowserForLocation();
}